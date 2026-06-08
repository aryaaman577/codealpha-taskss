import { z } from 'zod';

export const createMeetingSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
  type: z.enum(['instant', 'scheduled', 'recurring']).default('instant'),
  schedule: z
    .object({
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      timezone: z.string().min(2).max(50).optional(),
      recurring: z
        .object({
          frequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
          until: z.string().optional(),
        })
        .partial()
        .optional(),
    })
    .partial()
    .optional(),
  maxParticipants: z.number().int().min(2).max(200).optional(),
  settings: z
    .object({
      waitingRoomEnabled: z.boolean().optional(),
      muteOnJoin: z.boolean().optional(),
      videoOffOnJoin: z.boolean().optional(),
      allowChat: z.boolean().optional(),
      allowScreenShare: z.boolean().optional(),
      allowWhiteboard: z.boolean().optional(),
      allowFileShare: z.boolean().optional(),
      lockMeeting: z.boolean().optional(),
    })
    .partial()
    .optional(),
  passcode: z.string().min(4).max(6).optional(),
  chatHistory: z.boolean().optional(),
  tags: z.array(z.string().min(1).max(30)).optional(),
});
