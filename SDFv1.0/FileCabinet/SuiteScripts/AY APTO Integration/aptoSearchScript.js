/**
 * Apto - NetSuite search functions
 *
 * Version    Date            Author           Remarks
 *
 * 1.00       07 Jun 2016     georgem
 *
 * @module aptoSearchScript
 *
 * @requires aptoSalesTransactionDefs
 * @requires aptoSearchLib
 */

const ENTITY_SEARCH_COL_FIRST_NAME = 0;
const ENTITY_SEARCH_COL_LAST_NAME = 1;
const ENTITY_SEARCH_COL_COMP_NAME = 2;
const ENTITY_SEARCH_COL_ADDR = 3;
const ENTITY_SEARCH_COL_BCN = 4;
const ENTITY_SEARCH_COL_TAXID = 5;


/**
 *  Search wrapper - figure out calling mode and pass code to the actual search down the stream
 *
 *  @param {APTOEntitySearch} search parameters
 *
 * @returns {APTOEntitySearchResultBatch} search results
 *
 */
function nsEntitySearch(searchParams)
{
	var result = new APTOEntitySearchResultBatch();

	try
	{
		var ayEntitySearch = new AYEntitySearch(searchParams);

		result = ayEntitySearch.performSearch();

		result.isSuccess = true;
	}
	catch (e)
	{
		result.isSuccess = false;

		if ( e instanceof nlobjError )
		{
			result.errorCode = "NETSUITE_" + e.getCode()
			// result.error.message = e.getDetails();

		}
		else
		{

			result.errorCode = "UNEXPECTED_ERROR_" + e.message;
			// result.error.message = e.toString();
		}


	}
	return result;
}

/**
 * Search records with some minimal error handling
 *
 * @param {*} datain Apto search request
 * @returns {string[]} search results in array
 *
 */
function searchRecordWithErrorHandling(datain)
{
	var result = {};

	try {
		result = searchRecord(datain)

		// result.isSuccess = true;
	}
	catch (e) {
		if ( e instanceof nlobjError )
		{

			result["errorCode"] = "NETSUITE_" + e.getCode() + " " + e.getDetails();
		}
		else
			result["errorCode"] = e.message;

		result["isSuccess"] = false;

	}

	return result;


}
/**
 * Incorporating APTO's search code and enhancing it.
 *
 * @param datain
 * @returns {string[]}
 */
function searchRecord(datain)
{
 //nlapiLogExecution('DEBUG', 'test', 'test');

    var filters = [];
    var columns = [];
	var customerfilters = [];
    var isBatchSearch=false;

    var loadRecordToColumnsMap = {
        subsidiary: [
            'federalidnumber',
            'returnaddr'
        ],
        location: [
            'addrtext',
            'returnaddress_text',
            'mainaddress_text'
        ]
    };

    var submittedFilters = JSON.parse(datain.filters || "[]"); //  datain.filters; //
    var requestedColumns =  JSON.parse(datain.resultColumns || "[]"); // datain.resultColumns; //
    var searchOperator = datain.searchFilterOperator;

    var isLocationPhoneSearch = false;

    if (requestedColumns != null && requestedColumns.length > 0)
    {
        for(var col in requestedColumns) {

        	if (requestedColumns[col] == "addrphone")
        	{
        		nlapiLogExecution('DEBUG', 'addrphone', "skipping field");
        		isLocationPhoneSearch = true;
        	}
        	else if (requestedColumns[col] == "entity") {
                columns.push(new nlobjSearchColumn(requestedColumns[col]).setSort(true));
            } else {
                columns.push(new nlobjSearchColumn(requestedColumns[col]));
            }
        		
        }
    }


    if (datain.recordType == "subsidiary")
    {
    	nlapiLogExecution('DEBUG', 'subsidiary', "adding filters");

    	if (submittedFilters.length > 0)
    		submittedFilters.push('and');

    	submittedFilters.push(['isinactive', 'is', 'F']);
    	submittedFilters.push('and');
    	submittedFilters.push(['iselimination', 'is', 'F']);

    }
	
if(datain.recordType == "vendor" || datain.recordType == "customer" )
	{
		if (customerfilters.length > 0)
    		customerfilters.push('and');
		
		customerfilters.push(['isinactive', 'is', 'F']);
		customerfilters.push('and');
    	customerfilters.push(['systemnotes.field', 'noneof', 'CUSTENTITY_EXECUTE_AY_MAP']);
    	customerfilters.push('and');
    	customerfilters.push(['systemnotes.date', 'onorafter', 'lastweektodate']);
	}
	
 nlapiLogExecution('DEBUG', 'customerfilters',customerfilters[0]);
 nlapiLogExecution('DEBUG', 'customerfilters',customerfilters[1]);
 nlapiLogExecution('DEBUG', 'customerfilters',customerfilters[2]);
 
 nlapiLogExecution('DEBUG', 'customerfilters', JSON.stringify(customerfilters));
    nlapiLogExecution('DEBUG', 'submittedFilters', JSON.stringify(submittedFilters));
    nlapiLogExecution('DEBUG', 'columns', JSON.stringify(columns));
  //DELOITTE FIX - ACES- 833 - Release 05/23 (Sprint 7)//Dummy12345 6
    var searchResults = null;

		if(datain.isBatchSearch == 'true' && typeof(datain.offset) !='undefined' && typeof(datain.limit) !='undefined') {
			searchResults=bulkSearch(columns,datain.recordType,datain.offset,datain.limit,customerfilters);
			isBatchSearch=true;
			   nlapiLogExecution('DEBUG', 'searchResults',JSON.stringify(searchResults));
			    var searchResultsString = JSON.parse(JSON.stringify(searchResults));
				nlapiLogExecution('DEBUG', 'searchResultsString',searchResultsString);
				
				var searchResultLength = searchResultsString.length;
				nlapiLogExecution('DEBUG', 'searchResultLength',searchResultLength);
				
				if(datain.recordType == 'vendor')
				{
					var finalRes = [];
					
					for(var i = 0; i < searchResultLength; i++)
					{
						var recordId = searchResultsString[i].id;
						var newRecordObj = {};
						var columns = {"subsidiary": []};
						var internalid = {};
						
						var finalResult = JSON.parse(JSON.stringify(finalRes));
						var finalResultLength = finalResult.length;
						
						var index = -1;
						for(var j=0;j<finalResultLength;j++)
						{
							var recordVal = finalResult[j].id;
							
							if(recordVal == recordId)
							{
								index = j;
							}	
						}

						if(index >= 0)
						{
							finalRes[index].columns.subsidiary.push(searchResultsString[i].columns.internalid.internalid);
						}
					  else{
						//nlapiLogExecution('DEBUG', 'does not exist','does not exist');
						newRecordObj.id = searchResultsString[i].id;
						newRecordObj.recordtype = searchResultsString[i].recordtype;
						
						internalid.name = searchResultsString[i].id;
						internalid.internalid = searchResultsString[i].id;
						
						columns.internalid = internalid;
						
						columns.billcity = searchResultsString[i].columns.billcity;
						columns.billstate = searchResultsString[i].columns.billstate;
						columns.companyname = searchResultsString[i].columns.companyname;
						columns.billaddress = searchResultsString[i].columns.billaddress;
						columns.taxidnum = searchResultsString[i].columns.taxidnum;
						columns.isperson = searchResultsString[i].columns.isperson;
						columns.comments = searchResultsString[i].columns.comments;
						columns.entityid = searchResultsString[i].columns.entityid;
						columns.subsidiary[0] = searchResultsString[i].columns.internalid.internalid;
						
						
						newRecordObj.columns = columns;
						finalRes.push(newRecordObj);
					  }
					}
				}
				if(datain.recordType == 'customer')
				{
					var finalRes = [];
					
					for(var i = 0; i < searchResultLength; i++)
					{
						var recordId = searchResultsString[i].id;
						
						var newRecordObj = {};
						var columns = {"subsidiary": []};
						var internalid = {};
						var finalResult = JSON.parse(JSON.stringify(finalRes));
						var finalResultLength = finalResult.length;
						
						var index = -1;
						for(var j=0;j<finalResultLength;j++)
						{
							var recordVal = finalResult[j].id;							
							if(recordVal == recordId)
							{
								index = j;
							}
							
							
						}

						if(index >= 0)
						{
							//nlapiLogExecution('DEBUG', 'exist','exist');
							finalRes[index].columns.subsidiary.push(searchResultsString[i].columns.internalid.internalid);
						}
					  else{
						// nlapiLogExecution('DEBUG', 'does not exist','does not exist');
						newRecordObj.id = searchResultsString[i].id;
						newRecordObj.recordtype = searchResultsString[i].recordtype;
						
						internalid.name = searchResultsString[i].id;
						internalid.internalid = searchResultsString[i].id;
						
						columns.internalid = internalid;
						
						columns.billaddress = searchResultsString[i].columns.billaddress;
						columns.billcity = searchResultsString[i].columns.billcity;
						columns.billstate = searchResultsString[i].columns.billstate;
						columns.companyname = searchResultsString[i].columns.companyname;
						columns.entityid = searchResultsString[i].columns.entityid;
						columns.comments = searchResultsString[i].columns.comments;
						columns.custentity_source_system_id = searchResultsString[i].columns.custentity_source_system_id;
						columns.isperson = searchResultsString[i].columns.isperson;
						columns.custentity_ay_entity_scope = searchResultsString[i].columns.custentity_ay_entity_scope;
						columns.currency = searchResultsString[i].columns.currency;
						columns.subsidiary[0] = searchResultsString[i].columns.subsidiary.internalid;
						newRecordObj.columns = columns;
						
						finalRes.push(newRecordObj);
						nlapiLogExecution('DEBUG', 'finalRes[i] in for',JSON.stringify(finalRes));
					  }
					}
					
				}
		}

    if (validFilters(submittedFilters) && !isBatchSearch)
    	searchResults = nlapiSearchRecord(datain.recordType, null, submittedFilters, columns);

    if (loadRecordToColumnsMap.hasOwnProperty(datain.recordType))
    {
        var recordColumns = loadRecordToColumnsMap[datain.recordType];

        searchResults = searchResults.map(function(searchResult)
    		{
				// nlapiLogExecution('DEBUG', 'inside search result','inside search result');
	            // hack to get access to recordtype and columns
	            var result = JSON.parse(JSON.stringify(searchResult));
	            var nsRecord = nlapiLoadRecord(datain.recordType, result.id);

	            var record = JSON.parse(JSON.stringify(nsRecord));
 /**
	             * One more hack - NetSuite present data with HTML formatting, if invoked using token authentication
	             * Noway to see in advance, if it's going to happen. Following code parses returned columns and reformats them
	             */
	            recordColumns.forEach(function(recordColumn) {
	            	do {
	            		record[recordColumn] = String(record[recordColumn]).replace("<br>","\r\n");
					} while (String(record[recordColumn]).indexOf("<br>") > 0);

	                result.columns[recordColumn] = record[recordColumn];
	            });

	            // load subrecord if needed
	            if (isLocationPhoneSearch)
	            {
	            		var addressRec = nsRecord.viewSubrecord('mainaddress');
	            		result.columns['addrphone'] = nsRecord.getFieldValue('addrphone');
	            }
				// nlapiLogExecution('DEBUG', 'result.columns',result.columns);
	            return {
	                id: result.id,
	                recordtype: result.recordtype,
	                columns: result.columns
	            };
	        });
    }

    // don't return customers with the category 'Trust Client'
    if (searchResults && datain.recordType === 'customer') {
        searchResults = searchResults.filter(function(searchResult) {
            var result = JSON.parse(JSON.stringify(searchResult));
            return !(result.columns.category && result.columns.category.name && result.columns.category.name == 'Trust Client');
        });
    }
	if(datain.recordType == 'customer' || datain.recordType == 'vendor')
	{
		nlapiLogExecution('DEBUG', 'customer/vendor','customer/vendor');
		return finalRes || [];
	}
	else
	{
		nlapiLogExecution('DEBUG', 'other than customer/vendor','other than customer/vendor');
		 return searchResults || [];
	}
}

/**
 * Sanity check
 *
 * @param {string[]} search filters passed by Apto
 *
 * @return {boolean} filters do not have nulls
 */
function validFilters(submittedFilters)
{
	var isNull = false;

	for (var i = 0; i < submittedFilters.length; i++) {
		var oneFilter = submittedFilters[i];

		for (var j = 0; j < oneFilter.length; j++) {
			if (oneFilter[j] == null || oneFilter[j] == "null")
			{
				isNull = true;
				break;
			}
		}
		if (isNull)
			break;
	}

	return ! isNull;

}
//DELOITTE FIX - ACES- 833 - Release 05/23 (Sprint 7) 
function bulkSearch(columns,recordType,offset,limit,customerfilters) {

if(recordType == 'vendor' || recordType == 'customer')
{
	 nlapiLogExecution('DEBUG', 'customerfilters ###', JSON.stringify(customerfilters));
	columns.push(new nlobjSearchColumn("internalid","mseSubsidiary",null));
	 nlapiLogExecution('DEBUG', 'column pushed', 'column pushed');
	 
	 var search = nlapiCreateSearch(recordType,customerfilters,columns),
	 searchResults = search.runSearch(),
    resultIndex = offset,
    resultSet;

    resultSet = searchResults.getResults(offset, limit);
	 
}
 nlapiLogExecution('DEBUG', 'recordType', recordType);
 if(recordType != 'vendor' && recordType != 'customer')
{
	nlapiLogExecution('DEBUG', 'not vendor/customer', 'not vendor/customer');
	var search = nlapiCreateSearch(recordType,null,columns),
	searchResults = search.runSearch(),
    resultIndex = offset,
    resultSet;

    resultSet = searchResults.getResults(offset, limit);
}
    

	return resultSet;

}