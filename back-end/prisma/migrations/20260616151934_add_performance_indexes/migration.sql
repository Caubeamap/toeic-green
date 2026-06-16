-- CreateIndex
CREATE INDEX "question_groups_test_part_id_idx" ON "question_groups"("test_part_id");

-- CreateIndex
CREATE INDEX "questions_group_id_idx" ON "questions"("group_id");

-- CreateIndex
CREATE INDEX "questions_test_part_id_idx" ON "questions"("test_part_id");
