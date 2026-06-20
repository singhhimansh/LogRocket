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
];
