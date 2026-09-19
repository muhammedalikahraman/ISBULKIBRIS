export const OUTBOX_EVENTS = {
  cvParseRequested: "cv.parse.requested",
  jobTranslationRequested: "job.translation.requested",
  jobExpired: "job.expired",
  verificationDecided: "verification.decided",
} as const;

export type OutboxEventType = (typeof OUTBOX_EVENTS)[keyof typeof OUTBOX_EVENTS];

export type DomainEvent<T extends OutboxEventType = OutboxEventType, P = unknown> = {
  type: T;
  aggregateType: string;
  aggregateId: string;
  payload: P;
};
