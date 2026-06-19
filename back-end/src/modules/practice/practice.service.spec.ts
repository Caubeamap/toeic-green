import { PracticeService } from './practice.service';

describe('PracticeService.listQuestions', () => {
  it('returns published exam questions without loading the test snapshot first', async () => {
    const findMany = jest.fn().mockResolvedValue([
      {
        id: 123n,
        groupId: null,
        questionNumber: 1,
        stem: 'Question 1',
        optionA: 'A',
        optionB: 'B',
        optionC: 'C',
        optionD: 'D',
        imageUrl: 'https://media.example/q1.jpg',
        audioUrl: 'https://media.example/q1.mp3',
        testPart: { partNumber: 1 },
        group: null,
      },
    ]);
    const service = new PracticeService({
      question: { findMany },
    } as never);
    const snapshotSpy = jest
      .spyOn(service as unknown as { getTestsSnapshot: () => Promise<never> }, 'getTestsSnapshot')
      .mockRejectedValue(new Error('snapshot should not be loaded'));

    const result = await service.listQuestions('ets-2026-test-10');

    expect(snapshotSpy).not.toHaveBeenCalled();
    expect(findMany).toHaveBeenCalledTimes(1);
    expect(result).toEqual([
      {
        id: '123',
        partId: 'part-1',
        questionNumber: 1,
        passage: undefined,
        passageGroupId: undefined,
        stem: 'Question 1',
        options: [
          { label: 'A', text: 'A' },
          { label: 'B', text: 'B' },
          { label: 'C', text: 'C' },
          { label: 'D', text: 'D' },
        ],
        image_url: 'https://media.example/q1.jpg',
        audio_url: 'https://media.example/q1.mp3',
        transcript: null,
      },
    ]);
  });
});
