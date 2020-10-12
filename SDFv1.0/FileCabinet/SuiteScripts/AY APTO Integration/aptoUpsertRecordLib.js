/**
 * Code related to universal create/update NetSuite records call
 *
 * Version    Date            Author           Remarks
 *
 * 1.00       27 Jul 2016     georgem		   Functions related to upserting records (separating from RESTLet)
 *
 * @module aptoUpsertRecordLib
 */

/**
 * Universal wrapper, will process single record or array of parameters
 * @param {*} datain single record to create or array of records
 */
function createOrUpdateRecord(datain) {
    var records = datain.records || [datain];
    var results = [];

    results = records.map(upsertAndTrapError);

    return results;
}

/**
 * Added error wrapping to ensure that batch is getting processed
 *
 * https://holleb.atlassian.net/browse/AYPC-446
 *
 * @param dataIn
 * @returns {*}
 */
function upsertAndTrapError(dataIn)
{
	result = {
            "error": {
                "code": ""
                , "message": ""
            }
            , "record": dataIn
            , "id": ""
            , "externalid": ""
        };



	try
	{
		if ((! dataIn.hasOwnProperty("recordType")) || !dataIn.recordType)
		{

			result.error.message = "Missing mandatory field - recordType";
			dataIn.recordType = "";

			var error = new RESTLetResult();
			error.errorCode = "AY_EMPTY_RECORDTYPE";
			throw error;
		}

		result = upsert(dataIn);

	}
	catch (e)
	{
		//DELOITTE FIX: ACES-844 -- Error Log for Upsert Record Integration
		var errorCodeDetails = '';
		var record = nlapiCreateRecord("customrecord_ay_apto_int_errors");
		//DELOITTE FIX END

		if (dataIn.hasOwnProperty("id"))
			result.id = dataIn.id;

		if (dataIn.hasOwnProperty("columns") && dataIn.columns.hasOwnProperty("externalid"))
			result.externalid = dataIn.columns.externalid;

		if (e instanceof RESTLetResult)
		{
			result.error.code =  e.errorCode;
			errorCodeDetails = e.errorCode;

		}
		else if ( e instanceof nlobjError )
		{
			result.error.code = "NETSUITE_" + e.getCode();
			errorCodeDetails = "NETSUITE_" + e.getCode() + " " + e.getDetails();
			result.error.message = e.getDetails();

		}
		else
		{

			result.error.code = "UNEXPECTED_ERROR_" + e.message;
			errorCodeDetails = "UNEXPECTED_ERROR_" + e.message + " " + e.toString();
			result.error.message = e.toString();
		}

		nlapiLogExecution("ERROR", "Error Processing " + dataIn.recordType +
		" id " + dataIn.id + " externalid " + dataIn.columns.externalid,
		result.error.code + " " + result.error.message);

		//DELOITTE FIX: ACES-844 -- Error Log for Upsert Record Integration
		record.setFieldValue("custrecord_ay_apto_restlet_name", "aptoUpsertRecordRESTLet");
		record.setFieldValue("custrecord_ay_apto_http_method", "post");
		record.setFieldValue("custrecord_ay_apto_input", JSON.stringify(dataIn));
		record.setFieldValue("custrecord_ay_apto_error", errorCodeDetails);
	
		try{
			var recordId = nlapiSubmitRecord(record);
			nlapiLogExecution('AUDIT', "Error record created: ", recordId);
		}
		catch(e1){
			nlapiLogExecution('AUDIT', "Error in creating error log: ", e1.message);
		}
		//DELOITTE FIX END
		
		// nlapiLogExecution("ERROR", "Processing Error Code", result.error.code);
		// nlapiLogExecution('ERROR', 'Processing Error Message', result.error.message);

	}
	finally
	{

		return result;

	}

}

/**
 * Create or update single record in NetSuite
 *
 * @param {object} datain
 * @returns {*}
 */
function upsert(datain) {

	nlapiLogExecution('AUDIT', 'Creating/Updating Record', JSON.stringify(datain));

    var record = createOrLoadRecord(datain);

    // nlapiLogExecution('DEBUG','record', JSON.stringify(record));

    var subRecords = {};

    for (var fieldname in datain.columns)
    {

    		var value = datain.columns[fieldname];

	    if (fieldname.indexOf('bill') == 0) {
	        if (!subRecords['billingAddress']) {
	            subRecords['billingAddress'] = {};
	        }
	        subRecords['billingAddress'][fieldname.replace('bill', '')] = value;
	    }
	    else if (value)
	    {
	        if (value.internalid)
	        {
	        	if (value.name)
         	    {
            		nlapiLogExecution('DEBUG', fieldname +' setting name', value.name);
         	        record.setFieldText(fieldname, value.name);
         	    }

	            nlapiLogExecution('DEBUG',fieldname + ' internalid',  value.internalid);
	            record.setFieldValue(fieldname, value.internalid);


	        }
	        else
	        {
	            	var isSetValue = true;

	            	// external ID and entity id

	            	if (fieldname == "externalid" || fieldname ==  "entityid")
	            	{

	            		// should be only setup on add
	            		isSetValue = (record.getId() == null || record.getId() == "");
	            		nlapiLogExecution('DEBUG', fieldname, isSetValue?" setting on add":"skipping");
	            	}
	            	else
	            	{
	            		nlapiLogExecution('DEBUG', "fieldname", fieldname);
	            		if (fieldname == "email")
		            	{
		            		var recordEmail = record.getFieldValue("email");

		            		nlapiLogExecution('DEBUG', "Existing " + fieldname, recordEmail);

		            		isSetValue = (recordEmail == null || recordEmail == "" ||  recordEmail.length == 0)

		            		if (! isSetValue)
		            		{
		            			nlapiLogExecution('AUDIT',"Skipping email update", value);
		            		}
		            	}
	            	}
	            	if (isSetValue)
	            	{
	            		nlapiLogExecution('DEBUG', 'setting column ' + fieldname, value);
		            	record.setFieldValue(fieldname, value);

	        	}
	        }
	    }
    }

    if (datain.recordType == 'journalentry' && datain.line) {
        var jelines = createLineItems(record, 'line', datain.line);
        nlapiLogExecution('DEBUG', 'created journal lines', jelines);
    }

    for (var subRecordName in subRecords) {
        var subRecord = subRecords[subRecordName];
        record.selectLineItem('addressbook', 1);
        var subObject = record.editCurrentLineItemSubrecord('addressbook', 'addressbookaddress');
        if (!subObject) {
            record.selectNewLineItem('addressbook');
            subObject = record.createCurrentLineItemSubrecord('addressbook', 'addressbookaddress');
        }
        nlapiLogExecution('DEBUG', 'subRecord', JSON.stringify(subRecord));
        for (var fieldName in subRecord) {
            var val = subRecord[fieldName];
            nlapiLogExecution('DEBUG', 'subRecord', fieldName + ' ' + val);
            if (fieldName.indexOf('country') >= 0) {
                subObject.setFieldText(fieldName, val);
            } else {
                subObject.setFieldValue(fieldName, val);
            }
        }
        //record.setCurrentLineItemValue('addressbook', 'defaultbilling', 'true');
        subObject.commit();
        record.commitLineItem('addressbook');
    }

    var recordId = nlapiSubmitRecord(record);
    nlapiLogExecution('DEBUG', 'submitted record', recordId);
    var nlobj = nlapiLoadRecord(datain.recordType, recordId);
    nlapiLogExecution('DEBUG', 'record reloaded');

    if (datain.recordType == 'employee')
    	{
    		if (datain.columns['entityid'])
    		{
    			nlapiLogExecution('DEBUG', 'Setting entity id', datain.columns['entityid']);
    			nlobj.setFieldValue('entityid', datain.columns['entityid']);

    			nlapiSubmitRecord(nlobj);

    			nlobj = null;

    			nlobj = nlapiLoadRecord(datain.recordType, recordId);
    		}

    		nlobj = JSON.parse(JSON.stringify(nlobj));

        if (nlobj.hasOwnProperty("subordinates"))
        	{
        		nlapiLogExecution('DEBUG', 'Employee Record',"Subordinates detected - deleting");

        		delete nlobj.subordinates;
        	}
    }


    return {
        "record": nlobj
        , "id": nlobj.id
        , "externalid": datain.columns.externalid
    };
}

/**
 * Create line items with parameters record, linename and array of lines
 * @param {nlobjRecord} record loaded NetSuite record
 * @param {string} linename - name of the line item that needs to be created
 * @param {object[]} lines array of line data
 *
 * @returns {string}
*/
function createLineItems(record, linename, lines) {
    if (lines[0] && lines[0].account) {
        nlapiLogExecution('DEBUG','journal lines[0].account=' + lines[0].account.name + ', linename=' + linename);
    }

    for (var i=0; i<lines.length; i++) {
        var line = lines[i];
        record.selectNewLineItem(linename);
        for (var fieldname in line) {
            if (line.hasOwnProperty(fieldname)) {
                var value = line[fieldname];
                if (value) {
                    if (typeof value == 'object') {
                        if (value.internalid) {
                            nlapiLogExecution('DEBUG', 'internalid', fieldname + ' ' + value.internalid);
                            record.setCurrentLineItemValue(linename, fieldname, value.internalid);
                        }
                        else if (value.name) {
                            nlapiLogExecution('DEBUG','name', fieldname + ' ' + value.name);
                            record.setCurrentLineItemText(linename, fieldname, value.name);
                        }
                    } else {
                        nlapiLogExecution('DEBUG', 'column', fieldname + ' ' + value);
                        record.setCurrentLineItemValue(linename, fieldname, value);
                    }
                }
            }
        }
        record.commitLineItem(linename);
    }

    return JSON.stringify(lines);
}

/**
 * Create record if it's indeed new or load existing one
 *
 * @param {object} aptoRecord
 *
 * @returns {nlobjRecord}
 */
function createOrLoadRecord(aptoRecord)
{
	var record = null;
	// Let's try to see if we have this record
	if (aptoRecord.id)
	{
		try
		{
			record = nlapiLoadRecord(aptoRecord.recordType, aptoRecord.id);
		}
		catch (e)
		{
			nlapiLogExecution('DEBUG','Error loading record by ID', aptoRecord.recordType + " " + aptoRecord.id);
		}
	}

	if (record == null)
	{
		// let's see if we have other fields to try
		record = loadByOtherKeys(aptoRecord);
	}

	if (record == null)
	{
		// we have not been able to find it - let's create it
		//nlapiLogExecution('DEBUG','Creating new record');
		//nlapiLogExecution('DEBUG', 'Record Type: ', aptoRecord.recordType);
		record = nlapiCreateRecord(aptoRecord.recordType);
		nlapiLogExecution('DEBUG','Created new record', aptoRecord.recordType + " " + record.id);
	}

    return record;
}

/**
 * Search for record using externalId or entityId if either of those is present
 *
 * @param aptoRecord
 * @returns {nlobjRecord}
 */
function loadByOtherKeys(aptoRecord)
{
	var externalId = aptoRecord.columns.hasOwnProperty("externalid")?aptoRecord.columns.externalid:null;
	var entityId = aptoRecord.columns.hasOwnProperty("entityid")?aptoRecord.columns.entityid:null;
	var email = aptoRecord.columns.hasOwnProperty("email")?aptoRecord.columns.email:null; // AYPC-451
	var record = null;


	record = nsSearchForRecord(aptoRecord.recordType, 'entityId', entityId);


	if (record == null)
	{	
		//nlapiLogExecution('DEBUG', 'Searching for external ID...');
		record = nsSearchForRecord(aptoRecord.recordType, 'externalid', externalId);
	}

	if (record == null && aptoRecord.recordType == "employee") // AYPC-451
	{
		record = nsSearchForRecord(aptoRecord.recordType, 'email', email);
	}

	return record;
}

/**
 * Search for record using 1 field
 *
 * @param {string} recordType
 * @param {string} fieldName
 * @param {string} fieldValue
 *
 * @returns {nlobjRecord} NS record - if it was found
 */
function nsSearchForRecord(recordType, fieldName, fieldValue)
{
	var filterExpression = [];
	var record = null;

	if (fieldValue != null)
	{
		nlapiLogExecution('DEBUG',"Searching for " + recordType + " by " + fieldName, fieldValue);

		// construct very simple search filter
		filterExpression[0] = [fieldName, 'is',fieldValue];

		var searchresults = nlapiSearchRecord(recordType, null, filterExpression, null);

		if (searchresults != null && searchresults.length > 0)
		{
			// in reality, we can only get one record in this search (or none)

			var id = searchresults[0].getId();
			nlapiLogExecution('DEBUG',"Found existing record", id);
			record = nlapiLoadRecord(recordType, id);
		}

	}
	return record;
}