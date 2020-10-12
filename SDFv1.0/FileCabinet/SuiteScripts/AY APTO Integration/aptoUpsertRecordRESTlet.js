/**
 * <b>RESTLet</b>
 *
 * This code was originally created by Apto. Create or Update any record in NetSuite RESTLet has access to. This is example of tightly coupled
 * integraiton call, request data has to follow internal NetSuite structures. API Call examples are based on specific call, list of columns
 * would change - it should always correlate to recordType and table structure in NetSuite
 *
 * @module aptoUpsertRecordRESTLet
 *
 * @requires aptoSalesTransactionDefs
 * @requires aptoSalesTransactionLib
 * @requires aptoUpsertRecordLib
 *
 * @tutorial aptoUpsertRecordRESTLetRequest.schema
 * @tutorial aptoUpsertRecordRESTLetResponse.schema
 */

/**
 * Create/update a standard NetSuite record.  For Journal records, it will set lines as well.
 *
 * @param {Object} Request
 * @returns {Object} Response
 */
function postRESTlet(dataIn) {

	var restletInfo = new RESTLetInfo();

	restletInfo.logInvocation("aptoUpsertRecordRESTLet", "post", dataIn);

	var result =  createOrUpdateRecord(dataIn);

	restletInfo.logEOE(result);

	return JSON.stringify(result);
}
