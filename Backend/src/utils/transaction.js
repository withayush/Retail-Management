const mongoose = require("mongoose");

/**
 * Executes a callback within a MongoDB multi-document ACID transaction.
 * Automatically manages session lifecycle (start, commit, rollback on error, endSession).
 * If the connected MongoDB instance is a standalone server without replica set support
 * (common in single-node dev/testing), it smoothly executes the callback with session=null.
 *
 * @template T
 * @param {(session: mongoose.ClientSession|null) => Promise<T>} workFn - Callback containing database operations
 * @returns {Promise<T>}
 */
const withTransaction = async (workFn) => {
  let session = null;
  let useTransaction = false;

  try {
    session = await mongoose.startSession();
    session.startTransaction();
    useTransaction = true;
  } catch (sessErr) {
    // Standalone MongoDB without replica set or transactions disabled in local test
    session = null;
    useTransaction = false;
  }

  try {
    const result = await workFn(session);
    if (useTransaction && session && session.inTransaction()) {
      await session.commitTransaction();
    }
    return result;
  } catch (error) {
    if (useTransaction && session && session.inTransaction()) {
      try {
        await session.abortTransaction();
      } catch (abortErr) {
        console.warn("[Transaction] Warning during transaction rollback:", abortErr.message);
      }
    }
    throw error;
  } finally {
    if (session) {
      await session.endSession();
    }
  }
};

module.exports = {
  withTransaction,
};
