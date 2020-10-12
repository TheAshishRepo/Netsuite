/**
 * @NApiVersion 2.0
 * @NScriptType MapReduceScript
 */

var counter = 0;
var paramname = 'custscript_record_type_mr';
var processedrec = [];

define([ 'N/search', 'N/record', 'N/email', 'N/runtime', 'N/error', 'N/task' ],
		function(search, record, email, runtime, error, task) {

			function getInputData() {
				//TODO:Read a parameter for cust/vendor
				var scriptObj = runtime.getCurrentScript();
				var rectype = scriptObj.getParameter({name : paramname});
				log.debug('working for '+ rectype);
				// var searchResult = search.create({
				// 	type : rectype,
				// 	filters : [ [ "isinactive", "is", "F" ] ],
				// 	columns : [ search.createColumn({name : "internalid"}) ]
				// }).run();
				// //var searchResultSet = searchResult.getRange(15, 17);
				// log.debug('Search Result ', searchResult);
				// return searchResultSet;
				return search.create({
					type : rectype,
					filters : [ [ "isinactive", "is", "F" ] ],
					columns : [ search.createColumn({name : "internalid"}) ]
				});
				//var searchResultSet = searchResult.getRange(15, 17);
				

			}
			
			function map(context) {
				log.debug('map data ', context.value);
				var rec = JSON.parse(context.value);
				var scriptObj = runtime.getCurrentScript();
				var rectype = scriptObj.getParameter({name : paramname});
				var cust_data = rec.id;
				
				log.debug(rectype + ' is' + cust_data);
				processedrec.push(cust_data);
				try {
					var updateid = record.submitFields({
						type : rectype,
						id : cust_data,
						values : {
							custentity_execute_ay_map : 'T'
						},
						options : {
							enableSourcing : false,
							ignoreMandatoryFields : true
						}
					});
					log.audit('Updating flag for', updateid + "  is done");
				} catch (e) {
					log.audit('Cannot update flag for', cust_data + "  " + e.message);
				}
			}

			function summarize(summary) {
				var scriptObj = runtime.getCurrentScript();
				var rectype = scriptObj.getParameter({name : paramname});
				log.audit('summarize start '+rectype,processedrec);
				try {
					var scripttask = task.create({
						taskType : task.TaskType.MAP_REDUCE
					});
					scripttask.scriptId = 'customscript_ay_map_bill_to';
					scripttask.params = {'custscript_record_type_123' : rectype};
					scripttask.deploymentId = (rectype=='customer')?'customdeploy_billto':'customdeploy_vendor';
					
					var scriptTaskId = scripttask.submit();
					log.audit('Script Called now -->',JSON.stringify(scripttask));
				} catch (e) {
					log.audit("Error submitting job", JSON.stringify(e));
				}

				log.debug('summary', summary.reduceSummary);
			}

			return {
				config : {
					exitOnError : true
				},
				getInputData : getInputData,
				map : map,
				summarize : summarize
			};
		});