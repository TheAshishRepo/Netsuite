/**
 * Subsidiary/Bill To Association Automation. Scheduled script gets parameters from user event script and update association with subsidiaries based on them
 *
 *@NApiVersion 2.0
 *@NScriptType ScheduledScript
 *@module ay_ss_customer_maintenance
 *@requires ay_ss_customer_maintenance_helper
 */
define([ 'N/runtime','./ay_ss_customer_maintenance_helper'],
    function(runtime, ay_cust_ss_helper) {
		var logTitle = "AY | SS | Customer";

		/**
		 * This method is called by NetSuite when script is invoked
		 *
		 * @method execute
		 * @param {*} context Scheduled script execution context
		 */
		function execute(context) {

        		log.audit({
        		    title: logTitle,
        		    details: 'Script Started From ' + context.type
        		    });

			// let's get parameters
			var scriptObj = runtime.getCurrentScript();

			var nsEntity = {};
			nsEntity['id'] = scriptObj.getParameter({name: 'custscriptentityid'});
			nsEntity['scope'] = scriptObj.getParameter({name: 'custscriptentityscope'});
			nsEntity['primarySubId']  = scriptObj.getParameter({name: 'custscriptprimarysubid'});
			nsEntity['recordType'] = scriptObj.getParameter({name: 'custscriptentitytype'});

			log.debug({title : logTitle, details : JSON.stringify(nsEntity)});

			ay_cust_ss_helper.checkSubAssociation(nsEntity);

        		log.audit({
        			title: logTitle,
        			details: 'Script Ended'
    		    		});


        }
        return {
            execute: execute
        };
    });