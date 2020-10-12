 /**
 * @description Library of functions and classes used in NetSuite entity searches
 *
 *  Version    Date            Author           Remarks
 *
 * 1.00       24 Oct 2018     georgem          Multi-subsidiary entity search version
 *
 * @module aptoSearchLib
 */

 /**
  * Entity search class.
  * @class
  *
  * @param {APTOEntitySearch} searchParams search parameters passed by
  */

AYEntitySearch = function(searchParams)
{
    const ENTITY_SEARCH_COL_FIRST_NAME = 0;
    const ENTITY_SEARCH_COL_LAST_NAME = 1;
    const ENTITY_SEARCH_COL_COMP_NAME = 2;
    const ENTITY_SEARCH_COL_ADDR = 3;
    const ENTITY_SEARCH_COL_INTID = 4;
    // const ENTITY_SEARCH_COL_BCN = 4;
	
	//JIRA 370 (vendor search) Point 3
     const ENTITY_SEARCH_COL_TAXID = 5;
	 const ENTITY_SEARCH_COL_EXTID = 6;

    /**
     * @type APTOEntitySearch
     */
    this.aptoEntitySearch = searchParams;

    this.entityName = "";

    this.aptoEntitySearchResultBatch = new APTOEntitySearchResultBatch();

    this.aptoEntitySearchResultBatch.batchTransactionId =  this.aptoEntitySearch.batchTransactionId;


    /**
     * Simple logging wrapper
     *
     * @param {string} msg1
     * @param {string} msg2
     */
    function log(msg1, msg2)
    {
        var title = msg2 == null?"Entity Search":msg1;
        var message = msg2 == null?msg1:msg2;

        nlapiLogExecution("DEBUG",title, message);
    }

    /**
     * Backwards compatibility search. Might not do it any more,
     * but who knows ...
     */
    this.validateSearchParameters = function()
    {
        if (this.aptoEntitySearch.hasOwnProperty("searchType") &&
        		this.aptoEntitySearch.searchType != null &&
        		this.aptoEntitySearch.searchType != "")
		{
			log("Searching for " + this.aptoEntitySearch.searchType);
		}
		else
		{
			// backwards compatability mode - it's a vendor search
            log("Vendor search - backwards compatability mode");

            // let's populate missing properties
            this.aptoEntitySearch.searchType = ENTITY_SEARCH_TYPE_VENDOR;

			if (this.aptoEntitySearch.hasOwnProperty("vendorName"))
				this.aptoEntitySearch.companyName = this.aptoEntitySearch.vendorName;
        }

        this.entityName = this.aptoEntitySearch.searchType == ENTITY_SEARCH_TYPE_VENDOR?"vendor":"customer";

    }

    /**
     * NS search special - return array of columns to return from the search
     *
     * @returns {nlobjSearchColumn[]}
     */
    this.entitySearchColumns = function()
    {
        var columns = [];

        // columns we want to get back to APTO

        columns[ENTITY_SEARCH_COL_FIRST_NAME] = new nlobjSearchColumn('firstname', this.entityName, null);
        columns[ENTITY_SEARCH_COL_LAST_NAME] = new nlobjSearchColumn('lastname', this.entityName, null);
		columns[ENTITY_SEARCH_COL_COMP_NAME] = new nlobjSearchColumn('companyname', this.entityName, null);
        columns[ENTITY_SEARCH_COL_ADDR] = new nlobjSearchColumn('billaddress', this.entityName, null);
        columns[ENTITY_SEARCH_COL_INTID] = new nlobjSearchColumn('internalid', this.entityName, null);
		
        // columns[ENTITY_SEARCH_COL_BCN] =  new nlobjSearchColumn('bcn');
		//JIRA 370 (vendor search) Point 3
		if(this.aptoEntitySearch.searchType == ENTITY_SEARCH_TYPE_VENDOR)
		{
         columns[ENTITY_SEARCH_COL_TAXID] =  new nlobjSearchColumn('taxidnum',this.entityName, null);
		 columns[ENTITY_SEARCH_COL_EXTID] = new nlobjSearchColumn('entityid',this.entityName, null);
		}

        return columns;
    }

    /**
     * General filters for NS entity search
     */
    this.entitySearchFilters = function()
    {
        var filters = [];
		var filterSub = [];

        if (this.aptoEntitySearch.subsidiary != null && this.aptoEntitySearch.subsidiary != "")
        {
            log("Filters","Limiting search to subsidiary " + this.aptoEntitySearch.subsidiary);

            filters.push(["subsidiary","anyof",this.aptoEntitySearch.subsidiary])
			//filters.push("AND")
        }

       // DELOITTE FIX - ACES-779 - Release xx/xx (Sprint 6) 
	   if(this.aptoEntitySearch.searchType == ENTITY_SEARCH_TYPE_VENDOR)
		{
         if ( this.aptoEntitySearch.currency != null &&
             this.aptoEntitySearch.currency != "")
         {
             var currencyCode = "";
             var currencyMap = new CurrencyMap();
             currencyCode = currencyMap.getValue(this.aptoEntitySearch.currency);
			 
			log("Filters","APTO currency " + this.aptoEntitySearch.currency);
            log("Filters","Limiting search to currency " + currencyCode);
			

			filters.push("AND")
             filters.push(["vendor.currency","anyof",currencyCode])
			 
         }
		}
		// DELOITTE FIX-ACES -779 END
		
		if(this.aptoEntitySearch.searchType == ENTITY_SEARCH_TYPE_VENDOR)
		{
			filters.push("AND")
			filters.push(["vendor.isinactive","is","F"])
			filters.push("AND")
			filters.push(["vendor.category","noneof",3])
			
		}
		
		//JIRA 370 (vendor search) Point 2
		if(this.aptoEntitySearch.searchType == ENTITY_SEARCH_TYPE_VENDOR)
		{
			if (this.aptoEntitySearch.companySearch == null || this.aptoEntitySearch.companySearch == 'F' )
			{
				if((this.aptoEntitySearch.firstName != null && this.aptoEntitySearch.firstName != "")||(this.aptoEntitySearch.lastName != null && this.aptoEntitySearch.lastName != ""))
				{
					log("Searching for person", this.aptoEntitySearch.firstName + " " + this.aptoEntitySearch.lastName);
					
					filters.push("AND")
					filters.push(["vendor.isperson","is","T"])
					filters.push("AND")
					filters.push(["vendor.firstname","contains",this.aptoEntitySearch.firstName]) 
					filters.push("AND")
					filters.push(["vendor.lastname","contains",this.aptoEntitySearch.lastName]) 
					
					
				}
			}
			else
			{
				nlapiLogExecution("DEBUG","Searching for company", this.aptoEntitySearch.companyName);
				filters.push("AND")
				filters.push(["vendor.isperson","is","F"])
				filters.push("AND")
				filters.push(["vendor.entityid","contains", this.aptoEntitySearch.companyName]) 
				

			}
			
			
		//JIRA 370 (vendor search) Point 4
		if(this.aptoEntitySearch.extid != null && this.aptoEntitySearch.extid != "" && this.aptoEntitySearch.extidSearch == "T")
		{
			//According to Business external id is vendor id.
			filters.push("AND")
			filters.push(["vendor.entityid","is",this.aptoEntitySearch.extid])
			
			
			
		}
		if(this.aptoEntitySearch.city != null && this.aptoEntitySearch.city != "" && this.aptoEntitySearch.citySearch == "T")
		{
			nlapiLogExecution("DEBUG","Searching for city", this.aptoEntitySearch.city);
			filters.push("AND")
			filters.push(["vendor.city","contains",this.aptoEntitySearch.city])
			
			
		}
		//JIRA 556 
		if(this.aptoEntitySearch.stateid != null && this.aptoEntitySearch.stateid != "" && this.aptoEntitySearch.stateidSearch == "T")
		{
			var state = this.aptoEntitySearch.stateid;
			nlapiLogExecution("DEBUG","Searching for state", state);
			
			nlapiLogExecution("DEBUG","state length", state.length);
			
			if(state.length == 2)
			{
				var stateCap = state.toUpperCase();
				nlapiLogExecution("DEBUG","state 2 char", stateCap);
				filters.push("AND")
				filters.push(["vendor.state","anyof",stateCap])

			}
			else
			{
				var splitStr = state.toLowerCase().split(' ');
				for (var i = 0; i < splitStr.length; i++)
				{
      
					splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);     
				}
 
			var stateFullCap = splitStr.join(' '); 
			 
				nlapiLogExecution("DEBUG","state full name", stateFullCap);
				
				filters.push("AND")
				filters.push (["formulatext:{vendor.statedisplayname}","is",stateFullCap])
				
				
			}
		
			
			
		}
		}

		 // DELOITTE FIX - ACES - 780 - Release 05/23 (Sprint 7)//Dummy12345 6
		
		if(this.aptoEntitySearch.searchType == ENTITY_SEARCH_TYPE_BILL_TO)
		{
			
			filters.push("AND")
			filters.push(["customer.isinactive","is","F"])

			log("Searching for person", this.aptoEntitySearch.companyName + " " + this.aptoEntitySearch.companyName);
					
					filters.push("AND")
					filterSub.push(["customer.firstname","contains",this.aptoEntitySearch.companyName])

					filterSub.push("OR")
					filterSub.push(["customer.lastname","contains",this.aptoEntitySearch.companyName])

					filterSub.push("OR")

					filterSub.push(["customer.companyname","contains", this.aptoEntitySearch.companyName])
					filterSub.push("OR")
					filterSub.push(["customer.entityid","contains", this.aptoEntitySearch.companyName])

					filters.push(filterSub)
					
					
					
					
					//JIRA 370 (vendor search) Point 4
		if(this.aptoEntitySearch.extid != null && this.aptoEntitySearch.extid != "" && this.aptoEntitySearch.extidSearch == "T")
		{
			//According to Business external id is vendor id.
			nlapiLogExecution("DEBUG","Searching for entityid", this.aptoEntitySearch.extid);
			filters.push("AND")
			filters.push(["customer.entityid","is",this.aptoEntitySearch.extid])
			
			
			
		}
		if(this.aptoEntitySearch.city != null && this.aptoEntitySearch.city != "" && this.aptoEntitySearch.citySearch == "T")
		{
			nlapiLogExecution("DEBUG","Searching for city", this.aptoEntitySearch.city);
			filters.push("AND")
			filters.push(["customer.city","contains",this.aptoEntitySearch.city])
			
			
		}
		//JIRA 556 
		if(this.aptoEntitySearch.stateid != null && this.aptoEntitySearch.stateid != "" && this.aptoEntitySearch.stateidSearch == "T")
		{
			var state = this.aptoEntitySearch.stateid;
			nlapiLogExecution("DEBUG","Searching for state", state);
			
			nlapiLogExecution("DEBUG","state length", state.length);
			
			if(state.length == 2)
			{
				var stateCap = state.toUpperCase();
				nlapiLogExecution("DEBUG","state 2 char", stateCap);
				
				filters.push("AND")
				filters.push(["customer.state","anyof",stateCap])

			}
			else
			{
				var splitStr = state.toLowerCase().split(' ');
				for (var i = 0; i < splitStr.length; i++)
				{
      
					splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);     
				}
 
			var stateFullCap = splitStr.join(' '); 
			 
				nlapiLogExecution("DEBUG","state full name", stateFullCap);
				filters.push("AND")
				filters.push  (["formulatext:{customer.statedisplayname}","is",stateFullCap])
				
				
			}

		}
			
		}   
		
        nlapiLogExecution("DEBUG","filters", filters);
		nlapiLogExecution("DEBUG","filterSub", filterSub);
        return filters;

    }

    /**
	 *  Build filters and columns needed to search
	 *  Repackage results
	 *
	 *  @returns {APTOEntitySearchResultBatch}
     */
    this.doEntitySearch = function()
    {
        var results = new APTOEntitySearchResultBatch();

        var columns = this.entitySearchColumns();

        var filters = this.entitySearchFilters();

        var kind = this.aptoEntitySearch.searchType == ENTITY_SEARCH_TYPE_VENDOR?RECORD_TYPE_VENDOR_SUB_RELATION:RECORD_TYPE_CUST_SUB_RELATION;
        /** @type {nlobjSearchResult[]} **/
    	var searchResults = nlapiSearchRecord(kind, null, filters, columns);
		nlapiLogExecution("DEBUG","searchResults", searchResults);
    	// now we would need to repackage search results ... or else!
    	if (searchResults != null)
    	{
            log("Found something",searchResults.length);

    		for (var int = 0; int < searchResults.length; int++){

    			this.processOneEntitySearchResult(searchResults[int], columns)
    		}
    	}

        return results;
    }

    /**
     * Process one search result. Split into multiple with same id for different addresses
     *
     * @param {Object} searchResult - one result of entity search
     * @param {nlobjSearchColumn[]} - columns search result has
     */
    this.processOneEntitySearchResult = function(searchResult, columns)
    {

        log("Processing", JSON.stringify(searchResult));

		var aptoEntitySearchResult = new APTOEntitySearchResult();


		aptoEntitySearchResult.internalid = searchResult.getValue(columns[ENTITY_SEARCH_COL_INTID]);

		if (searchResult.getValue(columns[ENTITY_SEARCH_COL_COMP_NAME]) == "")
		{
			// first/last name
			aptoEntitySearchResult.companyname = searchResult.getValue(columns[ENTITY_SEARCH_COL_FIRST_NAME]) + " " +
			                                     searchResult.getValue(columns[ENTITY_SEARCH_COL_LAST_NAME]);
		}
		else
		{
			// company name
			aptoEntitySearchResult.companyname = searchResult.getValue(columns[ENTITY_SEARCH_COL_COMP_NAME]);
		}

		/** @type {nlobjRecord} **/
		var entity = nlapiLoadRecord(this.entityName, aptoEntitySearchResult.internalid, {});
		
		// vendor-specific fields lookup
		var taxIdName = "";
		var taxId = "";

		if (this.aptoEntitySearch.searchType == ENTITY_SEARCH_TYPE_VENDOR)
		{
	
		//JIRA 370 (vendor search) Point 3
		if (searchResult.getValue(columns[ENTITY_SEARCH_COL_COMP_NAME]) == "")
		{
			aptoEntitySearchResult.extid = searchResult.getValue(columns[ENTITY_SEARCH_COL_EXTID])+ " " + searchResult.getValue(columns[ENTITY_SEARCH_COL_FIRST_NAME]) + " " +searchResult.getValue(columns[ENTITY_SEARCH_COL_LAST_NAME]);
		}
		else
		{
			// company name
			aptoEntitySearchResult.extid = searchResult.getValue(columns[ENTITY_SEARCH_COL_EXTID])+ " " + searchResult.getValue(columns[ENTITY_SEARCH_COL_COMP_NAME]);
		}
		
		aptoEntitySearchResult.taxid = searchResult.getValue(columns[ENTITY_SEARCH_COL_TAXID]);
		
		nlapiLogExecution("DEBUG","External Id.............", aptoEntitySearchResult.extid);
		//nlapiLogExecution("DEBUG","Tax Id..................", aptoEntitySearchResult.taxid);
			
			
			// need to look up vendor id
			var taxIdName = "BCN";

            // let's add tax info to the record

            var taxId = entity.getFieldValue('bcn');


            if (taxId == null || taxId == "") // no BCN? Let's check US tax id for vendor
            {
                taxId = entity.getFieldValue('taxidnum');
                taxIdName = "Tax ID";
            }
		}

		//AYPC-883 - how many addresses do we have ??? ?
		var addrCount = entity.getLineItemCount("addressbook");

		if (this.aptoEntitySearch.searchType == ENTITY_SEARCH_TYPE_VENDOR || this.aptoEntitySearch.searchType == ENTITY_SEARCH_TYPE_BILL_TO)
		{

			if (addrCount > 0)
			{
				
				for (var j = 1; j <= addrCount; j++)
				{
					var entityRecord = JSON.parse(JSON.stringify(aptoEntitySearchResult));

					entity.selectLineItem("addressbook", j);

					var address  = entity.getCurrentLineItemValue("addressbook", "addressbookaddress_text");
					var state = entity.getCurrentLineItemValue("addressbook", "state");
					var stateFullName = entity.getCurrentLineItemValue("addressbook", "displaystate_initialvalue");
					var city = entity.getCurrentLineItemValue("addressbook", "city");
					
					nlapiLogExecution("DEBUG","stateFullName.............", stateFullName);
					var stateVal = this.aptoEntitySearch.stateid;
			
			var stateCap;
			var stateFullCap;
			var cityFullCap;
			
			if(stateVal)
			{
					if(stateVal.length == 2)
					{
						stateCap = stateVal.toUpperCase();
						
					}
					else
					{
					var splitStr = stateVal.toLowerCase().split(' ');
					for (var i = 0; i < splitStr.length; i++)
					{
		  
						splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);     
					}
	 
					stateFullCap = splitStr.join(' '); 
					}
			}	
					if(this.aptoEntitySearch.city != null && this.aptoEntitySearch.city != "" && this.aptoEntitySearch.citySearch == "T")
					{
						var cityVal = this.aptoEntitySearch.city;
						var splitStr = cityVal.toLowerCase().split(' ');
						for (var i = 0; i < splitStr.length; i++)
						{
			  
							splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);     
						}
		 
						cityFullCap = splitStr.join(' '); 
					}
					var flagState = false;
					var flagCity = false;
					
					if((this.aptoEntitySearch.stateid != null && this.aptoEntitySearch.stateid != "" && this.aptoEntitySearch.stateidSearch == "T") || (this.aptoEntitySearch.city != null && this.aptoEntitySearch.city != "" && this.aptoEntitySearch.citySearch == "T"))
					{
						if(stateCap == state || stateFullCap == stateFullName)
						{
							if (String(address).indexOf("<br>") > 0)
							{
								do
								{
									address = String(address).replace("<br>","\r\n");
								}
								while (String(address).indexOf("<br>") > 0);
							}

							if ( taxId != null &&  taxId != "")
							{
								address =  taxIdName + ": " +  taxId + "\r\n" + address;
							}
							entityRecord.billaddress = address;
							
							flagState = true;
						
						}
						if(cityFullCap == city)
						{
							if (String(address).indexOf("<br>") > 0)
							{
								do
								{
									address = String(address).replace("<br>","\r\n");
								}
								while (String(address).indexOf("<br>") > 0);
							}

							if ( taxId != null &&  taxId != "")
							{
								address =  taxIdName + ": " +  taxId + "\r\n" + address;
							}
							entityRecord.billaddress = address;
							
							flagCity = true;
						//nlapiLogExecution("DEBUG","flagCity.............", flagCity);
						}
						// both state and city have value
						if(this.aptoEntitySearch.stateid != null && this.aptoEntitySearch.stateid != "" && this.aptoEntitySearch.stateidSearch == "T" && this.aptoEntitySearch.city != null && this.aptoEntitySearch.city != "" && this.aptoEntitySearch.citySearch == "T")
						{
							if(flagState == true && flagCity == true)
							{
								this.aptoEntitySearchResultBatch.searchResults.push(entityRecord);
								
							}
						}
						
						// only state have value and city blank
						if((this.aptoEntitySearch.stateid != null && this.aptoEntitySearch.stateid != "" && this.aptoEntitySearch.stateidSearch == "T") && (this.aptoEntitySearch.city == null || this.aptoEntitySearch.city == "" || this.aptoEntitySearch.citySearch == "F"))
						{
							if(flagState == true && flagCity == false)
							{
								this.aptoEntitySearchResultBatch.searchResults.push(entityRecord);
								
							}
						}
						// only city have value and state blank 
						if((this.aptoEntitySearch.city != null && this.aptoEntitySearch.city != "" && this.aptoEntitySearch.citySearch == "T") && (this.aptoEntitySearch.stateid == null || this.aptoEntitySearch.stateid == "" || this.aptoEntitySearch.stateidSearch == "F"))
						{
							if(flagCity == true && flagState == false)
							{
								this.aptoEntitySearchResultBatch.searchResults.push(entityRecord);
								
							}
						}
					}
					else
					{
						if (String(address).indexOf("<br>") > 0)
						{
							do
							{
								address = String(address).replace("<br>","\r\n");
							}
							while (String(address).indexOf("<br>") > 0);
						}

						if ( taxId != null &&  taxId != "")
						{
							address =  taxIdName + ": " +  taxId + "\r\n" + address;
						}
						entityRecord.billaddress = address;
						this.aptoEntitySearchResultBatch.searchResults.push(entityRecord);
					}
					
				}

			}
			else
				this.aptoEntitySearchResultBatch.searchResults.push(aptoEntitySearchResult);

		}
		else
		{
			if (addrCount > 0)
		{
			log("Found " + this.entityName, addrCount +  " address(es) found");

			for (var j = 1; j <= addrCount; j++)
			{
				var entityRecord = JSON.parse(JSON.stringify(aptoEntitySearchResult));

				entity.selectLineItem("addressbook", j);

				var address  = entity.getCurrentLineItemValue("addressbook", "addressbookaddress_text");

				if (String(address).indexOf("<br>") > 0)
				{
					do
					{
						address = String(address).replace("<br>","\r\n");
					}
					while (String(address).indexOf("<br>") > 0);
				}

				if ( taxId != null &&  taxId != "")
				{
					address =  taxIdName + ": " +  taxId + "\r\n" + address;
				}
				entityRecord.billaddress = address;

				this.aptoEntitySearchResultBatch.searchResults.push(entityRecord);

			}

		}
		else
			this.aptoEntitySearchResultBatch.searchResults.push(aptoEntitySearchResult);

		}
    }
    /**
     * Perform search and return results in the expect format
     *
     * @returns {APTOEntitySearchResultBatch}
     */
    this.performSearch = function()
    {

    	/// log("Search Constructor", JSON.stringify(this.aptoEntitySearch));

        // checking passed parameters
        this.validateSearchParameters();

        this.doEntitySearch();

        return this.aptoEntitySearchResultBatch;
    }
}
