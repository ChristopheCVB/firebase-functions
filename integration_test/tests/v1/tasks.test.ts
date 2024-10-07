import * as admin from "firebase-admin";
import { initializeFirebase } from "../firebaseSetup";
import { createTask, retry } from "../utils";

describe("Cloud Tasks (v1)", () => {
  const region = process.env.REGION;
  const testId = process.env.TEST_RUN_ID;
  const projectId = process.env.PROJECT_ID;
  const queueName = `${testId}-v1-tasksOnDispatchTests`;

  if (!testId || !projectId || !region) {
    throw new Error("Environment configured incorrectly.");
  }

  beforeAll(async () => {
    await initializeFirebase();
  });

  afterAll(async () => {
    await admin.firestore().collection("tasksOnDispatchTests").doc(testId).delete();
  });

  describe("onDispatch trigger", () => {
    let loggedContext: admin.firestore.DocumentData | undefined;

    beforeAll(async () => {
      const url = `https://${region}-${projectId}.cloudfunctions.net/${testId}-v1-tasksOnDispatchTests`;
      await createTask(projectId, queueName, region, url, { data: { testId } });

      loggedContext = await retry(() =>
        admin
          .firestore()
          .collection("tasksOnDispatchTests")
          .doc(testId)
          .get()
          .then((logSnapshot) => logSnapshot.data())
      );
    });

    it("should have correct event id", () => {
      expect(loggedContext?.id).toBeDefined();
    });
  });
});
