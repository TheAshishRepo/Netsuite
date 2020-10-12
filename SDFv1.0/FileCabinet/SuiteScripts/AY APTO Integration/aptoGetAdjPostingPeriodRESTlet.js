/**
 * <b>RESTLet</b>
 *
 * Get adjustment posting period for existing NS invoice
 *
 * Version    Date            Author           Remarks

 * 1.00       02 Aug 2016     georgem
 *
 * @module aptoGetAdjPostingPeriodRESTlet
 *
 * @requires aptoSalesTransactionDefs
 * @requires aptoSalesTransactionLib
 * @requires aptoGetAdjPostingPeriodScript
 *
 * @tutorial aptoGetAdjPostingPeriodRESTletRequest.schema
 * @tutorial aptoGetAdjPostingPeriodRESTletResponse.schema
 */

/**
 * @summary HTTP Post
 * @description Get Adjustment Posting Period for the given invoice (or set of invoices)
 *
 * @param {APTOGetPostingPeriodRequest} dataIn Apto request
 * @returns {string} stringify'ed {APTOGetPostingPeriodResponse}
 *
 *
 * @method
 *
 */
function postRESTlet(dataIn) {

	var result = new APTOGetPostingPeriodResponse();

	var restletInfo = new RESTLetInfo();

	restletInfo.logInvocation("aptoGetAdjPostingPeriodRESTLet", "post", dataIn);

	result = transactionWrapper(function(dataIn){ return getInvoiceAdjustmentPostingPeriod(dataIn)}, null, dataIn);

	restletInfo.logEOE(result);

	return JSON.stringify(result);
}
