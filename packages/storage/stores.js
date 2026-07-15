export const STORE_NAMES = {
  ANALYTICS_EVENTS: "AnalyticsEvents",
  USER_IDENTITY: "UserIdentity",

}

export const STORE = [
  {
    name: "AnalyticsEvents",
    key: "eventId",
    indexes: [
      {
        name:
          "timestamp",

        keyPath:
          "timestamp",
      },
      {
        name:
          "type_timestamp",

        keyPath: [
          "type",
          "timestamp",
        ],
      },
    ],
  },
  {
    name: "UserIdentity",
    key: "sessionId",
    indexes: [
      {
        name:
          "userId",

        keyPath: 'userId',
      },
    ],
  },
];
