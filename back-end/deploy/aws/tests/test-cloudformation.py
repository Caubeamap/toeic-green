#!/usr/bin/env python3
"""Static contract tests for the single-instance AWS stack."""

from pathlib import Path
import re
import unittest

import yaml


TEMPLATE_PATH = Path(__file__).resolve().parents[1] / "cloudformation.yml"
RUNNER_PATH = Path(__file__).resolve().parent / "run.sh"


class CloudFormationLoader(yaml.SafeLoader):
    """Safely preserve CloudFormation short-form intrinsic functions."""


def construct_cloudformation_tag(loader, tag_suffix, node):
    tag_names = {
        "Ref": "Ref",
        "Sub": "Fn::Sub",
        "GetAtt": "Fn::GetAtt",
        "Join": "Fn::Join",
    }
    if isinstance(node, yaml.ScalarNode):
        value = loader.construct_scalar(node)
    elif isinstance(node, yaml.SequenceNode):
        value = loader.construct_sequence(node)
    else:
        value = loader.construct_mapping(node)
    return {tag_names.get(tag_suffix, f"Fn::{tag_suffix}"): value}


CloudFormationLoader.add_multi_constructor("!", construct_cloudformation_tag)


with TEMPLATE_PATH.open(encoding="utf-8") as template_file:
    TEMPLATE = yaml.load(template_file, Loader=CloudFormationLoader)


class CloudFormationContractTests(unittest.TestCase):
    def setUp(self):
        self.resources = TEMPLATE["Resources"]
        self.instance = self.resources["ApiInstance"]
        self.instance_properties = self.instance["Properties"]
        self.launch_template = self.resources.get("ApiLaunchTemplate")
        if self.launch_template:
            launch_data = self.launch_template["Properties"]["LaunchTemplateData"]
            self.user_data = launch_data["UserData"]["Fn::Base64"]["Fn::Sub"]
        else:
            self.user_data = self.instance_properties["UserData"]["Fn::Base64"]["Fn::Sub"]

    def test_single_arm64_instance_has_cost_and_storage_guardrails(self):
        instances = [
            resource
            for resource in self.resources.values()
            if resource["Type"] == "AWS::EC2::Instance"
        ]
        self.assertEqual(len(instances), 1)
        self.assertIn("ap-northeast-1", TEMPLATE["Description"])
        image_id = (
            self.launch_template["Properties"]["LaunchTemplateData"]["ImageId"]
            if self.launch_template
            else self.instance_properties["ImageId"]
        )
        self.assertIn("arm64", image_id)
        self.assertEqual(self.instance_properties["InstanceType"], "t4g.small")
        self.assertEqual(
            self.instance_properties["CreditSpecification"]["CPUCredits"], "standard"
        )
        self.assertNotIn("KeyName", self.instance_properties)
        root = self.instance_properties["BlockDeviceMappings"][0]["Ebs"]
        self.assertEqual(root["VolumeType"], "gp3")
        self.assertEqual(root["VolumeSize"], 30)
        self.assertIs(root["Encrypted"], True)
        self.assertIs(root["DeleteOnTermination"], True)

    def test_network_is_one_public_vpc_without_managed_data_services(self):
        resource_types = [resource["Type"] for resource in self.resources.values()]
        expected_counts = {
            "AWS::EC2::VPC": 1,
            "AWS::EC2::Subnet": 1,
            "AWS::EC2::InternetGateway": 1,
            "AWS::EC2::Route": 1,
            "AWS::EC2::EIP": 1,
            "AWS::EC2::EIPAssociation": 1,
        }
        for resource_type, count in expected_counts.items():
            self.assertEqual(resource_types.count(resource_type), count, resource_type)
        forbidden = {
            "AWS::EC2::NatGateway",
            "AWS::ElasticLoadBalancingV2::LoadBalancer",
            "AWS::RDS::DBInstance",
            "AWS::ElastiCache::CacheCluster",
            "AWS::ElastiCache::ReplicationGroup",
        }
        self.assertTrue(forbidden.isdisjoint(resource_types))
        association = self.resources["ApiElasticIpAssociation"]["Properties"]
        self.assertEqual(association["InstanceId"], {"Ref": "ApiInstance"})
        self.assertEqual(
            association["AllocationId"], {"Fn::GetAtt": "ApiElasticIp.AllocationId"}
        )

    def test_security_group_exposes_only_http_and_https(self):
        properties = self.resources["ApiSecurityGroup"]["Properties"]
        ingress = properties["SecurityGroupIngress"]
        self.assertEqual(
            {(rule["IpProtocol"], rule["FromPort"], rule["ToPort"]) for rule in ingress},
            {("tcp", 80, 80), ("tcp", 443, 443)},
        )
        self.assertTrue(all(rule["CidrIp"] == "0.0.0.0/0" for rule in ingress))
        self.assertEqual(
            properties["SecurityGroupEgress"],
            [{"IpProtocol": "-1", "CidrIp": "0.0.0.0/0"}],
        )

    def test_instance_role_is_ssm_managed_and_reads_only_the_prod_path(self):
        role = self.resources["InstanceRole"]["Properties"]
        self.assertNotIn("ManagedPolicyArns", role)
        statements = role["Policies"][0]["PolicyDocument"]["Statement"]
        self.assertEqual(len(statements), 4)
        expected_wildcard_actions = [
            {
                "ssm:DescribeAssociation",
                "ssm:GetDeployablePatchSnapshotForInstance",
                "ssm:GetDocument",
                "ssm:DescribeDocument",
                "ssm:GetManifest",
                "ssm:ListAssociations",
                "ssm:ListInstanceAssociations",
                "ssm:PutInventory",
                "ssm:PutComplianceItems",
                "ssm:PutConfigurePackageResult",
                "ssm:UpdateAssociationStatus",
                "ssm:UpdateInstanceAssociationStatus",
                "ssm:UpdateInstanceInformation",
            },
            {
                "ssmmessages:CreateControlChannel",
                "ssmmessages:CreateDataChannel",
                "ssmmessages:OpenControlChannel",
                "ssmmessages:OpenDataChannel",
            },
            {
                "ec2messages:AcknowledgeMessage",
                "ec2messages:DeleteMessage",
                "ec2messages:FailMessage",
                "ec2messages:GetEndpoint",
                "ec2messages:GetMessages",
                "ec2messages:SendReply",
            },
        ]
        wildcard_statements = [
            statement
            for statement in statements
            if statement["Effect"] == "Allow" and statement["Resource"] == "*"
        ]
        self.assertEqual(
            [set(statement["Action"]) for statement in wildcard_statements],
            expected_wildcard_actions,
        )
        parameter_statements = [
            statement
            for statement in statements
            if {"ssm:GetParameter", "ssm:GetParameters"}.intersection(statement["Action"])
        ]
        self.assertEqual(len(parameter_statements), 1)
        statement = parameter_statements[0]
        self.assertEqual(
            set(statement["Action"]),
            {"ssm:GetParameter", "ssm:GetParameters", "ssm:GetParametersByPath"},
        )
        self.assertEqual(
            statement["Resource"],
            {
                "Fn::Sub": "arn:${AWS::Partition}:ssm:${AWS::Region}:"
                "${AWS::AccountId}:parameter/toeic-green/prod/*"
            },
        )
        self.assertNotEqual(statement["Resource"], "*")
        self.assertNotIn("kms:Decrypt", str(role))

    def test_launch_template_changes_replace_the_instance(self):
        self.assertIn("ApiLaunchTemplate", self.resources)
        self.assertEqual(self.launch_template["Type"], "AWS::EC2::LaunchTemplate")
        launch_data = self.launch_template["Properties"]["LaunchTemplateData"]
        self.assertIn("ImageId", launch_data)
        self.assertIn("UserData", launch_data)
        self.assertNotIn("ImageId", self.instance_properties)
        self.assertNotIn("UserData", self.instance_properties)
        self.assertEqual(
            self.instance_properties["LaunchTemplate"],
            {
                "LaunchTemplateId": {"Ref": "ApiLaunchTemplate"},
                "Version": {"Fn::GetAtt": "ApiLaunchTemplate.LatestVersionNumber"},
            },
        )
        self.assertIn("${RepositoryUrl}", self.user_data)
        self.assertIn("${RepositoryBranch}", self.user_data)

    def test_imdsv2_is_host_only(self):
        metadata = self.instance_properties["MetadataOptions"]
        self.assertEqual(metadata["HttpEndpoint"], "enabled")
        self.assertEqual(metadata["HttpTokens"], "required")
        self.assertEqual(metadata["HttpPutResponseHopLimit"], 1)

    def test_instance_waits_for_network_and_signals_bootstrap_completion(self):
        self.assertIn("DependsOn", self.instance)
        self.assertEqual(
            set(self.instance["DependsOn"]),
            {"GatewayAttachment", "DefaultRoute", "PublicRouteAssociation"},
        )
        self.assertIn("CreationPolicy", self.instance)
        self.assertEqual(
            self.instance["CreationPolicy"],
            {"ResourceSignal": {"Count": 1, "Timeout": "PT15M"}},
        )
        self.assertIn("set -Eeuo pipefail", self.user_data)
        self.assertNotRegex(self.user_data, r"set\s+[^\n]*x")
        self.assertRegex(self.user_data, r"trap\s+['\"]?signal_exit['\"]?\s+EXIT")
        self.assertIn("/opt/aws/bin/cfn-signal", self.user_data)
        self.assertIn("--resource ApiInstance", self.user_data)
        self.assertIn("aws-cfn-bootstrap", self.user_data)

    def test_bootstrap_installs_and_verifies_host_dependencies(self):
        for package in ("docker", "git", "jq", "util-linux"):
            self.assertRegex(self.user_data, rf"dnf install[^\n]*\b{re.escape(package)}\b")
        self.assertIn("systemctl enable --now docker", self.user_data)
        self.assertIn("systemctl enable --now amazon-ssm-agent", self.user_data)
        self.assertRegex(self.user_data, r"systemctl is-active[^\n]*docker")
        self.assertRegex(self.user_data, r"systemctl is-active[^\n]*amazon-ssm-agent")

    def test_compose_download_is_pinned_verified_and_executable(self):
        self.assertIn("v2.39.4/docker-compose-linux-aarch64", self.user_data)
        self.assertIn(
            "49082844b87f03cdcd5f5bbef1ba8c9c897b7a2dfb80cea18d61ec8ca6117e0c",
            self.user_data,
        )
        self.assertIn("sha256sum -c", self.user_data)
        self.assertRegex(self.user_data, r"(?:chmod|install)[^\n]*0755")
        self.assertRegex(self.user_data, r"docker compose version[^\n]*2\.39\.4")

    def test_runtime_swap_and_repository_setup_are_safe_and_idempotent(self):
        self.assertRegex(self.user_data, r"install[^\n]*-m 0700[^\n]*/opt/toeic-green/runtime")
        self.assertRegex(self.user_data, r"grep[^\n]*/swapfile none swap sw 0 0")
        self.assertRegex(self.user_data, r"for attempt in 1 2 3 4 5")
        self.assertIn("git clone", self.user_data)
        self.assertRegex(self.user_data, r"test -d[^\n]*repo/.git")
        self.assertNotIn("deploy.sh", self.user_data)

    def test_parameters_reject_shell_metacharacters_and_invalid_email(self):
        parameters = TEMPLATE["Parameters"]
        self.assertEqual(
            parameters["RepositoryUrl"]["Default"],
            "https://github.com/Caubeamap/toeic-green.git",
        )
        self.assertEqual(parameters["RepositoryBranch"]["Default"], "main")
        test_cases = {
            "AlertEmail": ("alerts@example.com", "not-an-email"),
            "RepositoryUrl": (
                "https://github.com/Caubeamap/toeic-green.git",
                "https://github.com/x/y.git;curl bad",
            ),
            "RepositoryBranch": ("release/2026-09", "main;curl bad"),
        }
        for name, (accepted, rejected) in test_cases.items():
            self.assertIn("AllowedPattern", parameters[name], name)
            pattern = parameters[name]["AllowedPattern"]
            self.assertIsNotNone(re.fullmatch(pattern, accepted), name)
            self.assertIsNone(re.fullmatch(pattern, rejected), name)
            self.assertIsNone(re.fullmatch(pattern, accepted + "\ncommand"), name)

    def test_budget_is_notification_only_and_excludes_credits(self):
        budget = self.resources["GrossCostBudget"]["Properties"]
        definition = budget["Budget"]
        self.assertEqual(definition["BudgetLimit"], {"Amount": 10, "Unit": "USD"})
        self.assertEqual(definition["BudgetType"], "COST")
        self.assertEqual(definition["TimeUnit"], "MONTHLY")
        self.assertIs(definition["CostTypes"]["IncludeCredit"], False)
        self.assertIn("IncludeRefund", definition["CostTypes"])
        self.assertIs(definition["CostTypes"]["IncludeRefund"], False)
        notifications = budget["NotificationsWithSubscribers"]
        actual = {
            item["Notification"]["Threshold"]
            for item in notifications
            if item["Notification"]["NotificationType"] == "ACTUAL"
        }
        forecasted = {
            item["Notification"]["Threshold"]
            for item in notifications
            if item["Notification"]["NotificationType"] == "FORECASTED"
        }
        self.assertEqual(actual, {50, 80})
        self.assertEqual(forecasted, {100})
        self.assertTrue(
            all(
                item["Notification"]["ThresholdType"] == "PERCENTAGE"
                for item in notifications
            )
        )
        self.assertIn("BudgetBehavior", TEMPLATE["Outputs"])
        self.assertIn("notification-only", TEMPLATE["Outputs"]["BudgetBehavior"]["Value"].lower())

    def test_outputs_explain_host_readiness_without_claiming_app_readiness(self):
        outputs = TEMPLATE["Outputs"]
        self.assertEqual(outputs["InstanceId"]["Value"], {"Ref": "ApiInstance"})
        self.assertEqual(outputs["ElasticIp"]["Value"], {"Ref": "ApiElasticIp"})
        self.assertEqual(outputs["SsmParameterPath"]["Value"], "/toeic-green/prod/")
        self.assertIn("HostBootstrapStatus", outputs)
        status = outputs["HostBootstrapStatus"]["Value"].lower()
        self.assertIn("host", status)
        self.assertIn("not application-ready", status)

    def test_runner_conditionally_reports_cloudformation_lint_status(self):
        runner = RUNNER_PATH.read_text(encoding="utf-8")
        self.assertIn("cfn-lint", runner)
        self.assertRegex(runner, r"SKIP[^\n]*cfn-lint")


if __name__ == "__main__":
    unittest.main(verbosity=2)
