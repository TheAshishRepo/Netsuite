/**
 * <b>RESTLet</b>
 *
 * Vendor and Bill TO (<i>Entity</i>) NetSuite search API
 *
 * Version    Date            Author           Remarks
 *
 * 1.00       02 Aug 2016     georgem
 *
 * 1.10       07 Jun 2016     georgem
 *
 * 2.00		  18 Jul 2017     georgem          Changing to support BILL TO and vendor search
 * @module aptoEntitySearchRESTLet
 *
 * @requires aptoSearchLib
 * @requires aptoSearchScript
 * @requires aptoSalesTransactionDefs
 *
 * @tutorial aptoEntitySearchRESTletRequest.schema
 * @tutorial aptoEntitySearchRESTletResponse.schema
 *
 */

/**
 * Search for NetSuite Vendor or bill to based on partial name entered by user and deal subsidiary and currency.
 *
 * If entity found has more than one address, to minimize changes on Apto side, it has been decided to return data as multiple search results
 *
 * @param {APTOEntitySearch} dataIn search parameters
 *
 * @returns {APTOEntitySearchResultBatch} search results (could be empty)
 */
function postRESTlet(dataIn) {

	var restletInfo = new RESTLetInfo();

	restletInfo.logInvocation("aptoEntitySearchRESTLet", "post", dataIn);

	var result = nsEntitySearch(dataIn);

	restletInfo.logEOE(result);


	return JSON.stringify(result);
}
