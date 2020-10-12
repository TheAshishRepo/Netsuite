/**
 * @NApiVersion 2.0
 * @NScriptType MapReduceScript
 */
var counter=0;
var paramname = "custscript_record_type_123"; 
define(['N/search', 'N/record', 'N/email', 'N/runtime', 'N/error','./ay_ss_customer_maintenance_helper_new'],
    function(search, record, email, runtime, error,ay_cust_ss_helper)
    {

        function getInputData()
        {	
        	var scriptObj = runtime.getCurrentScript();
			var rectype = scriptObj.getParameter({name : paramname});
			log.debug('Starting for',rectype);
			//TODO:The search has to be scaled
        	return search.create({
        	   type: rectype,
        	   filters:
        	   [    
        	    ["custentity_execute_ay_map","is","T"]
               ],
        	   columns:
        	   [
        	      search.createColumn({
        	         name: "internalid",
        	         summary: "GROUP",
        	         label: "Internal ID"
        	      }),
        	      search.createColumn({
        	         name: "custentity_ay_entity_scope",
        	         summary: "GROUP",
        	         label: "AY Record Type"
        	      }),
        	      search.createColumn({
        	         name: "subsidiary",
        	         summary: "GROUP",
        	         label: "Internal ID"
        	      })
        	   ]
        	});
        } // function getInputData()

  
        function map(context)
        {
            log.debug('map data',context.value);
            var rec = JSON.parse(context.value);
        	var scriptObj = runtime.getCurrentScript();
			var rectype = scriptObj.getParameter({name : paramname});
            var values={
                    "scope":rec.values['GROUP(custentity_ay_entity_scope)'].value,
                    "primarySubId":rec.values['GROUP(subsidiary)'].value,
                    'rectype':rectype
                   };
        context.write({
          key:rec.values['GROUP(internalid)'].value ,
          value:values          	
        });


        } 

        function reduce(context)
        {
            log.audit('reduce data ' + counter,context);
            var cust_data=JSON.parse((context.values)[0])

			var nsEntity = {};
			nsEntity['id'] = context.key;
			nsEntity['scope'] = cust_data.scope;
			nsEntity['primarySubId']  =cust_data.primarySubId;
			nsEntity['recordType'] = cust_data.rectype;
			log.debug({title :'nsEntity '+counter , details : JSON.stringify(nsEntity)});
			ay_cust_ss_helper.checkSubAssociation(nsEntity);
          
           counter++;
//          if(counter>=15){
//            log.debug('error');
//            var errorObj = error.create({
//        		    name: '15 Record limit',
//        		    message: '15 Records have been processed',
//        		    notifyOff: true
//        		});
//        	 throw errorObj.message;
//          }

        } 
  
        function summarize(summary)
        {
               log.debug('summary', summary.reduceSummary);
        }

        return {
    
            getInputData: getInputData,
            map: map,
            reduce: reduce,
            summarize: summarize
        };

    });