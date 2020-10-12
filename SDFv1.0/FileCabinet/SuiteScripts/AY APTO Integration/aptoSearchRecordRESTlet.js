/**
 * <b>RESTLet</b>
 *
 * Version    Date            Author           Remarks
 *
 * 1.00       09 Nov 2016     georgem
 *
 * This RESTLet originally was written by Apto. It's tightly coupled with NetSuite - parameter object includes
 * list of columns and search filters as well as NetSuite record type to search for. I added sanity checks, some validation
 * and bunch of work around to make sure this search worked in specific cases where NetSuite returned too much data
 * or data Apto could not handle - response is array of JSON.stringify'd NetSuite record object.
 * @module aptoSearchRecordRESTlet
 *
 * @requires aptoSalesTransactionDefs
 * @requires aptoSalesTransactionLib
 * @requires aptoSearchLib
 * @requires aptoSearchScript
 *
 * @tutorial aptoSearchRecordRESTLetRequest.schema
 * @tutorial aptoSearchRecordRESTLetResponse.schema
 * @tutorial NetSuite_RESTLet_Invocation_Error_Response.schema
 *
 *
 */

/**
 * @summary HTTP Post method
 *
 * @description Apto NetSuite generic search API end point.
 *
 * @param {Object} Request
 * @returns {Object} Response
 */
function postRESTlet(dataIn) {
	// Validate if mandatory record type is set in the request
	var result = null;

	var restletInfo = new RESTLetInfo();

	restletInfo.logInvocation("aptoSearchRecordRESTLet", "post", dataIn);


	if (!dataIn.recordType) {
		result = {
				"error" : {
					"code" : "AY_EMPTY_RECORDTYPE",
					"message" : "Record type is required to perform a search."
					}
				};
	}
	else
		result = searchRecordWithErrorHandling(dataIn);

  restletInfo.logEOE(result);
  return result;

}
