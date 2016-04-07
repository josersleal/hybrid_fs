/*
  @Author: Juraj Ciljak
  @email:juraj.ciljak@accenture.com, 
  @Version: 1.0
  @LastModified: 20.04.2015; 
  @Description: Object for ServiceOrder
  @WARNING: 
*/
var ServiceOrder = new ServiceOrderController();

function ServiceOrderController(){
	"use strict";

	var RecordId = "";
	var Parameters = {};
	var SERVICE_TAB = "service-order-tabs-panel";

	this.ServiceOrderController = function(parameters){
		try{
			ServiceOrder.ClearObject();
			Parameters=parameters;
			RecordId = parameters.Id;
			var Id='';
			switch (Parameters.Page.toLowerCase()){
				case "details.html":
					Id=Parameters.RecordId;
					break;
				default:
					break;
			}
			ServiceOrder.getSmartStoreData(Id);
		}catch(err){
			LOG.store(err,{"Where":"ServiceOrderController","parameters":parameters});
		}
	};

	this.ClearObject = function(){
		try{
			RecordId = "";
			Parameters = {};
			$("#"+SERVICE_TAB).html("");
			$("#"+SERVICE_TAB).trigger( "create" );
		}
		catch(err){
			LOG.store(err,{"Where":"ServiceOrder - ClearObject"});
		}
	};
	
	this.getSmartStoreData =  function(recordId){
		try{
			var SQL_PARAMS = SQLTable[Parameters.SQL];
			var iLimit = SQL_PARAMS.LIMIT;
			var SOUP_SQL= SQL_PARAMS.SQL;
			var sORDERBY = SQL_PARAMS.ORDERBY;
			var Params = {Ids:[], VariableType : "String", ReplaceValue : ":RecordId", VariableValue : recordId};
			var WHERE = ReplaceSQLParameters(SQL_PARAMS.WHERE,Params);
			logToConsole()("SQLite for  [ " + SOUP_SQL+WHERE + sORDERBY+" ]");
			var urlPage = Parameters.Page;
			var querySpec = sfSmartstore().buildSmartQuerySpec(SOUP_SQL+WHERE+sORDERBY, iLimit);
			sfSmartstore().runSmartQuery(querySpec, function(cursor) {
				var page = cursor.currentPageOrderedEntries;
				switch(urlPage.toLowerCase()){
					case "details.html":
						onSuccessSPDataRetrieveDetail(page);
						break;
					case "index.html":
						onSuccessSPDataRetrieve(page); 
						break;
					default:
						break;
				}
			},function(error){
				LOG.store(error,{"Where":"ServiceOrder - getSmartStoreData - runSmartQuery","querySpec":querySpec});
			});
		}
		catch(err){
			LOG.store(err,{"Where":"ServiceOrder - getSmartStoreData","recordId":recordId});
		}
	};

	this.prepareServiceOrderDetailData = function(record){
		//rebuild data structure for divBuilder function 
		//@Changes: in future create switchable function for more detail pages work order ,....and avoid retrive _soup
		var result= [];
		try{
			var entry, installation, equipment;
			for (var i = 0, j = record.length; i < j; i++){
				entry = record[i];
				if(record[i].length>0){
					installation =  checkFieldValue(record[i][1],"string");  
				}
				else{ 
					installation ="";
				}
				if(record[i].length>1) 
				{ 
					equipment =  checkFieldValue(record[i][2],"string");
				}
				else{
					equipment = "";
				}
				var ID_SAP_CRM = checkFieldValue(entry[0].WRTS_SAP_Order_ID__c,"string");
				ID_SAP_CRM += ' / ';
				ID_SAP_CRM += checkFieldValue(entry[0].Name,"string");

				var argObject = { Name:ID_HIDDEN ,  sValue: entry[0].Id , nValue:0, fdType:"string", displayType : DISPLAY_TYPE_HIDDE };
				result.push(argObject); 

				argObject = { displayType : DISPLAY_TYPE_LINE_BREAK};
				result.push(argObject);

				argObject = { displayType : DISPLAY_TYPE_LINE_BREAK};
				result.push(argObject);

				argObject = { Name:"Description" ,  sValue: checkFieldValue(entry[0].WRTS_Notification_Description__c,"string") , nValue:0, fdType:"string", displayType : DISPLAY_TYPE_VALUE_LARGE};
				result.push(argObject);

				argObject = { Name:"ID (SAP / CRM)" ,  sValue: ID_SAP_CRM , nValue:0, fdType:"string", displayType : DISPLAY_TYPE_NORMAL };
				result.push(argObject);

				argObject = { Name:"Installation" ,  sValue: installation , nValue:0, fdType:"string", displayType : DISPLAY_TYPE_NORMAL };
				result.push(argObject);

				argObject = { Name:"Equipment" ,  sValue: equipment , nValue:0, fdType:"string", displayType : DISPLAY_TYPE_NORMAL };
				result.push(argObject);

				argObject = { Name:"Basic Start" ,  sValue: checkFieldValue(entry[0].CKSW__Start_Date_Date__c,"date") , nValue:0, fdType:"date", displayType : DISPLAY_TYPE_NORMAL };
				result.push(argObject);

				argObject = { Name:"Basic End" ,  sValue: checkFieldValue(entry[0].CKSW__End_Date_Date__c,"date") , nValue:0, fdType:"date",displayType : DISPLAY_TYPE_NORMAL};
				result.push(argObject);

				argObject = { displayType : 'line-break' };
				result.push(argObject);

				argObject = { Name:"Contact Person" ,  sValue:  checkFieldValue(entry[0].Contact_Person_At_Site__c,"string") , nValue:0, fdType:"string",displayType : DISPLAY_TYPE_NORMAL}; 
				result.push(argObject); //Not yet table

				argObject = { Name:"Email" ,  sValue: checkFieldValue(entry[0].WRTS_Contact_Person_Email__c,"string") , nValue:0, fdType:"string",displayType : DISPLAY_TYPE_NORMAL}; 
				result.push(argObject);  

				argObject = { Name:"Phone" ,  sValue: checkFieldValue(entry[0].WRTS_Contact_Person_Phone__c,"string") , nValue:0, fdType:"string",displayType : DISPLAY_TYPE_NORMAL}; 
				result.push(argObject);       	

				argObject = { Name:"Coordinator" ,  sValue: checkFieldValue(entry[0].WRTS_Coordinator_Name__c,"string") , nValue:0, fdType:"string",displayType : DISPLAY_TYPE_NORMAL}; 
				result.push(argObject); 
				//Martin
				argObject = { displayType : DISPLAY_TYPE_LINE_BREAK };
				result.push(argObject);
				argObject = { Name: FIELD_SERVICE_ORDER_LONG_TEXT ,  sValue: checkFieldValue(entry[0].CKSW__Description__c,"string") , nValue:0, fdType:"string", displayType : DISPLAY_TYPE_SECTION };
				result.push(argObject);

			}// end for
		}
		catch(err){
			LOG.store(err,{"Where":"ServiceOrder - prepareServiceOrderDetailData","record":record});
			result = [];
		}
		return result;
	};

	function onSuccessSPDataRetrieve(response){
		try {
			$("#"+DIV_INDEX_SERVICE_ORDER_LIST).html("");
			if(Parameters.Init===true) {
				MessagesPage.messageTemplate(DIV_INDEX_PAGE_STATUS,MSG_OK,"",undefined,false);
				MessagesPage.messageTemplate(DIV_SERVICE_ORDER_PAGE_STATUS,MSG_OK,"",undefined,false);
			}
			if((response===null) || (response.length<=0)){
				MessagesPage.messageTemplate(DIV_INDEX_PAGE_STATUS,MSG_WARNING,VALUE_NO_RECORDS);
				MessagesPage.messageTemplate(DIV_SERVICE_ORDER_PAGE_STATUS,MSG_WARNING,VALUE_NO_RECORDS);
			}
			var ul = $('<ul class="wartsila-ul service-order-list"></ul>');
			var Id = "", name = "", entry, installation = "";

			//Example ServiceOrder.html
			var ServiceOrderPage = PagesLayout["ServiceOrder"];
			var ProgressValue; var ServiceOrderPageValue = "";
			if(ServiceOrderPage===undefined){
				ProgressValue = MessagesPage.ProgressValue;
				var ProcessBar = jQuery.extend(true, {}, PROGRESS_BAR); // Process bar
				ProcessBar.ProgressValue = 100;
				MessagesPage.ProgressValue= ProcessBar.ProgressValue;
				MessagesPage.messageTemplate(DIV_INDEX_PAGE_STATUS,MSG_WARNING,"Page for Service Order is not defined",ProcessBar);
				MessagesPage.ProgressValue = ProgressValue;
			}
			else{
				ServiceOrderPageValue = ServiceOrderPage.Value;
			}
			for (var i = 0, j = response.length; i < j; i++) {
				entry = response[i];
				Id = entry[0].Id;
				name = checkFieldValue(entry[0].WRTS_SAP_Order_ID__c,"string");
				var  sdate = checkFieldValue(entry[0].CKSW__Start_Date_Date__c,"date");
				installation ="";
				//Realy by by carful about what you get from salesforce and from smartstroe __r
				if(response[i].length>0){
					installation =  checkFieldValue(response[i][1],"string");  
				} 
				else{ installation =""; }
				var  desc = checkFieldValue(entry[0].WRTS_Notification_Description__c,"string"); 
				var URIdesc = encodeURI(desc);
				var newLi = $('<li>' +
								'<a href="'+ServiceOrderPageValue+'?id=' + Id + '&desc='+URIdesc+'" class="li-link">' +
									'<p class="no-margin no-padding">' +
										'<span class="header">' + installation + '</span>' +
									'</p>' +
									'<p class="no-margin no-padding">'+
										'<span class="name">' + name + '</span>' +
									'</p>'+
									'<div>' + 
										'<table class="details-table" border="0" cellpadding="0" cellspacing="0">' +
											'<tr>' +
												'<td class="description"><p class="no-margin no-padding ellipsis-wrap">' + desc + '</p></td>' +
												'<td class="date"><p class="no-margin no-padding">' + sdate + '</p></td>' +
											'</tr>' +
										'</table>' +
									'</div>' +
								'</a>' +
							  '</li>'
				);
				ul.append(newLi);
			}
			$("#"+DIV_INDEX_SERVICE_ORDER_LIST).append(ul);
			$("#"+DIV_INDEX_SERVICE_ORDER_LIST).trigger( "create" );
			if((Parameters.Parameters!==undefined) && (Parameters.JobLine!==undefined)){
				JobQueues.JobProcess(Parameters.Parameters,Parameters.JobLine);
			}
		}
		catch(err) {
			LOG.store(err,{"Where":"ServiceOrder - onSuccessSPDataRetrieve","response":response});
		}
	}

	function onSuccessSPDataRetrieveDetail(response) {
		try {
				var locResponse = ServiceOrder.prepareServiceOrderDetailData(response); // create JSON object
				$("#service-order-detail-tab-panel").html("");
				var content = $('<div class="padded-sides-container"></div>');
				var detailsTable = $('<div class="wartsila-detail-list" ></div>');
				var entry; 
				var Id = ""; 
				var name = ""; 
				var value = "";
				for (var i = 0, j = locResponse.length; i < j; i++){
					entry = locResponse[i];
					value = entry.sValue; 
					name = entry.Name; 
					var newRow;
					switch(entry.displayType){
						case DISPLAY_TYPE_HIDDE :
							Id = entry.sValue;
							break;
						case DISPLAY_TYPE_LINE_BREAK:
							newRow = $('<div class="section-delimiter"><p></p></div>');
							break;
						case DISPLAY_TYPE_SECTION:
							newRow = $(
							'<div class="row">' +
								'<div class="label"><p class="large no-margin no-padding">' + name + '</p></div>' +
								'<div class="value"><p class="no-margin no-padding">' + value + '</p></div> ' +
							'</div>' 
							);
							break;
						case DISPLAY_TYPE_VALUE_LARGE:
							newRow = $(
							'<div class="row">' +
								'<p class="large small-padding small-margin">' + value + '</p>' +
							'</div>' 
							);
							break;
						default:
							newRow = $(
							'<div class="row">' +
								'<div class="label"><p class="no-margin no-padding">' + name + '</p></div>' +
								'<div class="value"><p class="no-margin no-padding">' + value + '</p></div> ' +
								'<div class="dotted"></div>' +
							'</div>' 
							);
							break;
					}
					detailsTable.append(newRow);
				}
			$(content).append(detailsTable);
			$("#service-order-detail-tab-panel").append(content);
			$("#service-order-detail-tab-panel").trigger( "create" );
		}
		catch(err) {
			LOG.store(err,{"Where":"ServiceOrder - onSuccessSPDataRetrieveDetail","response":response});
		}
	}

}