/**
 * @summary Vendor User Event Script
 *
 * @description
 *
 * Version    Date            Author           Remarks
 *
 *
 * 1.00       22 Feb 2017     georgem		   Initial version
 *
 * 2.00 	  11 Oct 2018     georgem		   Moved code to common event script project, changed to use same scheduled script
 * as bill to
 * @module ay_ue_vendor
 * @appliedtorecord vendor
 */

 /**
  * NetSuite name of the list to store currencies assocaited with vendor
  *
  *  @var NS_VENDOR_CURRENCY_LIST
  */
 var NS_VENDOR_CURRENCY_LIST = "currency";

/**
 * @summary User Event - after submit
 * @description Vendor/Subsidiary relationship management - call scheduled script if changes were made
 * @appliedtorecord vendor
 *
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderitems (PO only)
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function userEventAfterSubmit(type){

	var logTitle = "AY Vendor Maintenance";

	log("Script started " + type, "AY Vendor Maintenance", "AUDIT");
	var context = nlapiGetContext();
	var executionContext = context.getExecutionContext();

	log("Invoked from " + executionContext, logTitle);
	if (executionContext == "userinterface" || executionContext == "csvimport")
	{
		if (type == "delete")
		{
			log("Vendor is getting deleted - nothing to do", logTitle);
		}
		else
		{
			var vendorRecord = nlapiGetNewRecord();

			var isInactive = vendorRecord.getFieldValue("isinactive");

			if (isInactive == "T") // AYPC-999 - should not execute on deactivation
			{
				log("Vendor is inactivated - nothing to do", logTitle);
			}
			else
			{
				// this script needs to extract id of the vendor that was added,
				var vendorId = nlapiGetRecordId();
				// primary subsidiary
				var primarySubsidiary = vendorRecord.getFieldValue("subsidiary");
				// and AY vendor type
				var vendorType = vendorRecord.getFieldValue("custentity_ay_entity_scope");


				log("Vendor Id " + vendorId, logTitle);
				log("Vendor primary sub " + primarySubsidiary, logTitle);
				log("Vendor type " + vendorType, logTitle);

				// and pass this information to the scheduled script as parameters
//				var params = {
//						custscriptvendorid: vendorId,
//						custscriptprimarysub : primarySubsidiary,
//						custscriptvendortype : vendorType};

				var params = {custscriptentityid: nlapiGetRecordId(),
							  custscriptentityscope: vendorRecord.getFieldValue("custentity_ay_entity_scope"),
						      custscriptprimarysubid: vendorRecord.getFieldValue("subsidiary"),
						      custscriptentitytype : nlapiGetRecordType()};


				// so that the scheduled script API knows which script to run, set the custom ID
				// specified on the Script record. Then set the custom ID on the Script Deployment
				for (var int = 1; int <= 5; int++) {
					var deployId = "customdeploy_ay_ss_vendor" + int;
					try
					{
						var scheduleResult = nlapiScheduleScript('customscript_ay_ss_customer', deployId, params);

						if (scheduleResult == "QUEUED")
							break;
						else
							log("Scheduling into different q (" + int + ")");

						if (scheduleResult != "QUEUED")
						{
							log("Failed to kick off scheduled script","Error","ERROR");
						}
					}
					catch (e)
					{
						log(e.message, "Unexpected Error scheduling script", "ERROR");
					}
				}

				log("Script scheduled " + scheduleResult, logTitle);
			}

		}

	}
	else
	{
		log("Script does not support invocations from " + executionContext, logTitle);
	}

	log("Script done", logTitle, "AUDIT");
}

/**
 * @summary User Event - before submit
 * @description This method does 2 things: makes sure that currency for primary subsidiary is in the currency list of this vendor and
 * fixes address, so AvidExchange check printing does not have issues with it
 *
 * @appliedtorecord vendor
 *
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderitems (PO only)
 *                      paybills (vendor payments)
 * @returns {Void}
 * @method userEventBeforeSubmit
 */
function userEventBeforeSubmit(type)
{

	var logTitle = "AY Vendor Maintenance (beforeSubmit)";

	log("Script started " + type, logTitle, "AUDIT");

	var context = nlapiGetContext();
	var executionContext = context.getExecutionContext();

	log("Invoked from " + executionContext, logTitle);

	if (executionContext == "userinterface" || executionContext == "csvimport")
	{
		if (type == "delete")
		{
			log("Vendor is getting deleted - nothing to do", logTitle);
		}
		else if (type == "create" || type == "edit")
		{


			var vendor = nlapiGetNewRecord();


			// let's load currency from primary sub
			var currency = nlapiLookupField('subsidiary',vendor.getFieldValue("subsidiary") , 'currency');

			var currencyLineNumber = vendor.findLineItemValue(NS_VENDOR_CURRENCY_LIST, "currency", currency);

			if (currencyLineNumber <= 0)
			{
				// add it into the list
				vendor.selectNewLineItem(NS_VENDOR_CURRENCY_LIST);
				vendor.setCurrentLineItemValue(NS_VENDOR_CURRENCY_LIST, "currency", currency);
				vendor.commitLineItem(NS_VENDOR_CURRENCY_LIST);

				log("Adding currency " + currency, logTitle);

				bRecordChanged = true;
			}

			var addressCount = vendor.getLineItemCount('addressbook');

			if (addressCount > 0)
			{
				for(var i = 1; i<=addressCount; i++)
				{
					vendor.selectLineItem('addressbook', i);
					var address = vendor.getCurrentLineItemValue('addressbook','addrtext');
					if (address != null && address != "")
					{
						var addrLines = address.split(/\r?\n/g);

						for (var j = 0; j < addrLines.length; j++) {
							addrLines[j] = addrLines[j].trim();
						}

						address = addrLines.join("\n");

						log(address,logTitle);

						vendor.setCurrentLineItemValue('addressbook','addrtext', address);
						vendor.commitLineItem('addressbook');
					}

				}

			}

		}
		else
			log("operation " + type + " not supported", logTitle);
	}
	else
	{
		log("Script does not support invocations from " + executionContext, logTitle);
	}

	log("Script done", logTitle, "AUDIT");
}

/**
 * NS log wrapper
 *
 * @param {String} message - mandatory parameter, message to log
 * @param {String} title - optional
 * @param {String} logLevel - defaults to "DEBUG"
 *
 * @method log
 */
function log(message, title, logLevel)
{
	if (title == null || title == NaN)
	{
		title = logTitle;
	}
	else
	{
		var temp = title;
		title = message;
		message = temp;
	}
	if (logLevel == NaN || logLevel == null)
		logLevel = "DEBUG";

	nlapiLogExecution(logLevel, message, title);
}