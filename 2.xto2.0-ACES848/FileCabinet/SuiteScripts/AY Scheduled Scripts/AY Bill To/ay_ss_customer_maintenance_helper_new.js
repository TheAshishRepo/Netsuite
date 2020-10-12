/**
 * Customer Search Script Helper
 *
 *ay_cust_ss_helper.js
 *@NApiVersion 2.0
 * @module ay_ss_customer_maintenance_helper
 */
Array.prototype.indexOf = function (thing)
{
    // if the other array is a falsy value, return -1
    if (!this)
        return -1;

    //start by assuming the array doesn't contain the thing
    var result = -1;
    for (var i = 0, l=this.length; i < l; i++)
      {
      //if anything in the array is the thing then change our mind from before
      if (this[i] instanceof Array)
      {
        if (this[i].equals(thing))
          result = i;
        else
          if (this[i]===thing)
            result = i;
      }
      else
    	  if (this[i]===thing)
    	  {
    		  result = i;
    		  break;
    	  }


      }
     //return the decision we left in the variable, result
    return result;
}

define(['N/search', 'N/record', 'N/error'],
		function(search, record, error)
		{
			/**
			 * Entity Scope  **Global**
			 * @constant AY_ENTITY_TYPE_GLOBAL
			 */
			var AY_ENTITY_TYPE_GLOBAL = "1";
			/**
			 * Entity Scope **Country**
			 * @constant AY_ENTITY_TYPE_COUNTRY
			 */
			var AY_ENTITY_TYPE_COUNTRY = "2";
			/**
			 *  Entity Scope **Subsidiary Only**
			 * @constant AY_ENTITY_TYPE_SUB_ONLY
			 */
			var AY_ENTITY_TYPE_SUB_ONLY = "3";

			/**
			 *  NetSuite list name to save currencies
			 *
			 * @constant NS_ENTITY_CURRENCY_LIST
			 */
			var NS_ENTITY_CURRENCY_LIST = "currency";

			/**
			 * Default title of debug log
			 */
			var logTitle = "Entity/Sub Maintenance";

			/**
			 * Get list of currencies valid for this entity type
			 * @method getCurrencyList
			 * @param {Object} nsEntity Entity (bill to or verndor) information
			 */
			function getCurrencyList(nsEntity)
			{
				var currencies = [];
				// Global entity type should have a list of currencies associated with it ...
				if (nsEntity.scope == AY_ENTITY_TYPE_GLOBAL)
				{
					log.debug("Global Entity Setup", "Getting Currency List");

					search.create({type: 'currency',
                				 columns: [],
							 filters: []}).run().each(function(result) { currencies.push(result.id); return true;});
				}
				return currencies;
			}
			/**
			 * Get list of subsidiaries
			 *
			 * @param {String} subCountry get all subs with country matching this one. Unless it's null - in this case get them all
			 *
			 * @method getSubList
			 */
			function getSubList(subCountry)
			{
				// log.debug("Subsidiary search", "Country " + subCountry);
				var subList = [];

				var filters = [['iselimination', 'is', 'F'],
										'and',
									   ['isinactive', 'is', 'F']];

				if (subCountry != null)
				{
					filters.push('and');
					filters.push(['country', 'is', subCountry]);
				}

				// log.debug("Filters", JSON.stringify(filters));

				var subSearch = search.create({type: 'subsidiary',
                				 columns: ['name'],
							 filters: filters});

				subSearch.run().each(function(result) { subList.push(result.id); return true;});

				return subList;
			}
			/**
			 * Get array of subsidiary IDs based on scope information
			 *
			 * @method getSubsForScope
			 * @param {Object} nsEntity bill to/vendor information
			 */
			function getSubsForScope(nsEntity)
			{
				var subsidiaries = [];

				if (nsEntity.scope == AY_ENTITY_TYPE_SUB_ONLY)
				{
					// simplest case, we should have only 1 line in the association list - primary sub and nothing else
					subsidiaries.push(nsEntity.primarySubId);
				}
				else
				{
					var subCountry = null;
					// let's get sub list - either all or country matching country of primary sub
					if (nsEntity.scope == AY_ENTITY_TYPE_COUNTRY)
					{
						var subData = search.lookupFields({type : 'subsidiary',
                                                             id : nsEntity.primarySubId,
                                                        columns : ['country']});

						// log.debug("Country of sub", JSON.stringify(subData));

						subCountry = subData.country[0].value;
					}
					// get all not-elimination subsidiary matching
					subsidiaries = getSubList(subCountry);
				}

				return subsidiaries;
			}

			/**
			 * Update list of entity/subsidiary associations
			 *
			 * @method updateSubAssociations
			 * @param {Object} nsEntity entity (vendor or bill to) information
			 * @param {string[]} subsidiaries array of subsidiary IDs
			 */
			function updateSubAssociations(nsEntity, subsidiaries)
			{
				searchType = (nsEntity.recordType == "customer")?"customersubsidiaryrelationship":"vendorsubsidiaryrelationship";

				// log.debug(nsEntity.recordType + " sub List", JSON.stringify(subsidiaries));

				// update has to be done 2 ways - remove all subs that are not in subsidiaries array
				// and add those that are not in array, but should be there
				search.create({type: searchType,
					columns: ['entity', 'subsidiary'],
				    filters: ['entity','is',nsEntity.id]}).run().each(
			                    function(result, index){
			                        // do we have this sub in the list?
			                    	var index = subsidiaries.indexOf(result.getValue({
		                                name: 'subsidiary'}));


			                    	if ( index == -1)
			                    	{
			                    		// log.debug(logTitle, "Sub " + result.getValue({name: 'subsidiary'}) + " not in the list" );
			                    		try
			                    		{
			                    			record.delete({type : searchType,
			                    								id : result.id});
			                    		}
			                    		catch (e)
			                    		{
			                    			log.debug("Error deleting Sub from the list", JSON.stringify(e));
			                    		}
			                    	}

			                    	return true;

			                    });


         		// let's see if we have any subs that are not in the list, but should be
				// caching sub list into array
				var entitySubs = [];
				search.create({type: searchType,
					columns: ['entity', 'subsidiary'],
				    filters: ['entity','is', nsEntity.id]}).run().each(function(result) { entitySubs.push(result.getValue({name: 'subsidiary'})); return true;});

				 log.debug("Current association list", JSON.stringify(entitySubs));

				// comparing arrays
				subsidiaries.forEach(function(subId) {
					if (entitySubs.indexOf(subId) == -1)
					{
						// log.debug(logTitle, "Adding sub " + subId + " to association list");

						var entityListRecord = record.create({
						       type: searchType,
						       isDynamic: true
						   });

						entityListRecord.setValue({
						    fieldId: 'entity',
						    value: nsEntity.id});

						entityListRecord.setValue({
						    fieldId: 'subsidiary',
						    value: subId});

						entityListRecord.save({
							    enableSourcing: true,
							    ignoreMandatoryFields: true});
					}

				});

			}
			/**
			 * Update list of currencies selected entity should accept (based on the type)
			 *
			 * @methodupdatedCurrencyList
			 *
			 * @param {Object} nsEntity entity (vendor or bill to) information
			 * @param {string[]} currencies lsit of currency's internal IDs
			 */
			function updatedCurrencyList(nsEntity, currencies)
			{
				// load entity record
				var entityRecord = record.load({id: nsEntity.id,
					type: nsEntity.recordType,
					isDynamic: true});

				var isSave = false;

				currencies.forEach(function(currencyId) {
					// get position in the list for selected currency
					// log.debug("Checking currency", currencyId);
					var lineNumber = entityRecord.findSublistLineWithValue({
					    sublistId: NS_ENTITY_CURRENCY_LIST,
					    fieldId: 'currency',
					    value: currencyId
					});

					// log.debug("currency " + currencyId, "line " + lineNumber);

					if (lineNumber < 0) // it's not there??? Let's add it
					{
						isSave = true;
						entityRecord.selectNewLine(NS_ENTITY_CURRENCY_LIST ); // sublistId:

						entityRecord.setCurrentSublistValue({
						    sublistId: NS_ENTITY_CURRENCY_LIST,
						    fieldId: 'currency',
						    value: currencyId
						});

						entityRecord.commitLine({sublistId: NS_ENTITY_CURRENCY_LIST });
					}

				});

//				if (isSave) // only save record, if it's needed
					{
					entityRecord.setValue({
						fieldId:'custentity_execute_ay_map',
						value:false
					})
					entityRecord.save({
					    enableSourcing: true,
					    ignoreMandatoryFields: true});

					}
			}

			/**
			 * Check association of entity with subsidiaries - entry point.
			 *
			 * @method checkSubAssociation
			 * @param {Object} nsEntity entity information (id, scope, primarySubId)
			 */
			function checkSubAssociation(nsEntity)
			{	try{
				// get list of subsidiaries, based on entity configuration
				var subsidiaries = getSubsForScope(nsEntity);
				// get list of currencies (based on entity configuration)
				var currencies = getCurrencyList(nsEntity);

				updateSubAssociations(nsEntity, subsidiaries);

				updatedCurrencyList(nsEntity, currencies);

			}catch(e){
				log.debug('helper error',e);
			}

			}


		return { checkSubAssociation : checkSubAssociation }
		}
);
