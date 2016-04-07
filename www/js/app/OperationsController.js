/*
  @Author: Juraj Ciljak, 
  @email:juraj.ciljak@accenture.com, 
  @LastModified: 19.04.2015; 
  @Description: Controller for Operations page
  @WARNING: 
*/

var Operations = new Operation();

function Operation(){

	var RecordId 	= "";
	var Parameters  = {};

	this.OperationController = function(parameters){
		try{
			this.ClearSparePart();
			if(parameters!==undefined){
				this.Parameters = parameters;
				var Id = this.Parameters.RecordId;
				this.getSmartStoreData(Id,parameters);
			}
		}
		catch(err){
			LOG.store(err,{"Where":"Operations - OperationController","parameters":parameters});
		}
	};

	this.ClearSparePart = function(){
		try{
			RecordId = "";
			Parameters = {};
		}
		catch(err){
			LOG.store(err,{"Where":"Operations - ClearSparePart"});
		}
	};

	//Method for get data from SmartStore
	this.getSmartStoreData =  function(recordId,params){
		try{
			var SQL_PARAMS = SQLTable[params.SQL];
			var iLimit = SQL_PARAMS.LIMIT;
			var sORDERBY = SQL_PARAMS.ORDERBY;
			var SOUP_SQL= SQL_PARAMS.SQL;
			var Params = {Ids:[], VariableType : "String", ReplaceValue : ":RecordId", VariableValue : recordId};
			var WHERE = ReplaceSQLParameters(SQL_PARAMS.WHERE,Params);	
			logToConsole()("SQLite for  [ " + SOUP_SQL+ WHERE +sORDERBY +" ]");
			var querySpec = sfSmartstore().buildSmartQuerySpec(SOUP_SQL+WHERE+sORDERBY, iLimit);
			sfSmartstore().runSmartQuery(querySpec, function(cursor) {
				var page = cursor.currentPageOrderedEntries;
				if(params && params.Page){
					switch(params.Page){
						case DIV_OPERATIONS_DETAIL_DATA :
							onSuccessRetrieveOperationDetail(page,params);
							break;
						default:
							onSuccessSPDataRetrieve(page);
							break;
					}
				}else{
					onSuccessSPDataRetrieve(page);
				}
			},function(error){
				LOG.store(error,{"Where":"Operations - getSmartStoreData - runSmartQuery","querySpec":querySpec,"recordId":recordId,"params":params});
			});
		}
		catch(err){
			LOG.store(err,{"Where":"Operations - getSmartStoreData","recordId":recordId,"params":params});
		}
	};

	//div renderer
	function onSuccessSPDataRetrieve(response){
		try{
			$("#operations-panel").html("");
			var table = $('<table class="wartsila-table-a" border="0" cellpadding="0" cellspacing="0" ></table>' );
			$("#operations-panel").append(table);
			var tbody = $("<tbody></tbody>");
			var entry; var Id = "";
			var name = "";
			var desc = "";
			var progress = "";
			//Go through the entries in the response.
			//Worth noting is that each entry is an array with one value. Thats why for example the Id is assigned as entry[0].Id
			for(var i = 0,j = response.length; i < j; i++){
				entry = response[i];
				Id = entry[0].Id;
				name = checkFieldValue(entry[0].Name,"string"); 
				desc = checkFieldValue(entry[0].WRTS_Operation_description__c,"string");
				progress = checkFieldValue(entry[0].WRTS_Operation_Progress__c,"string");
				if (progress === null || progress.length <= 0) {
					progress = 0;
				}
		  		var newRow = $(
		  			'<tr>'+
						'<td>'+
							'<a id="'+Id+'" onclick="Operations.OperationPopUp(this)" '+ 
							  ' data-position-to="window"   data-transition="pop" '+
							  ' data-iconshadow="true" data-wrapperels="span" '+
							  ' data-theme="c" aria-haspopup="true" aria-owns="#operation-popup" class="operations-popup-button reset-styles">'+		
								progress + '%'+
							'</a>'+
						'</td>'+
						
						'<td>'+
						'<a id="'+Id+'" onclick="Operations.OperationPopUp(this)" '+ 
							  ' data-position-to="window"   data-transition="pop" '+
							  '  data-iconshadow="true" data-wrapperels="span" '+
							  ' data-theme="c" aria-haspopup="true" aria-owns="#operation-popup" class="operations-popup-button reset-styles">'+		
							desc +
						'</a>'+
						'</td>'+
						
					'</tr>'
				);
				tbody.append(newRow);
			}
			table.append(tbody);
			$("#operations-panel").append(table);
			$("#operations-panel").trigger( "create" );
		}
		catch(err) {
			LOG.store(err,{"Where":"Operations - onSuccessSPDataRetrieve","response":response});
		}
	}

	function onSuccessRetrieveOperationDetail(response,params){
		try{
			var locResponse = response;
			var div_content;
			var isFisrtFSC = true; // flag for Coordinator
			var isFisrtFSE = true; // flag for Engineer
			//ActiveAppLocation = { PageName:"",TabName:"", PopUpName:"", RefreshTab:"" ,Record: {RecordId:"", ParenId:""}, Data:{}}
			if((params!==undefined) && (params.Page!==undefined)){
				switch(params.Page){
					case DIV_OPERATIONS_DETAIL_DATA :
						div_content = DIV_OPERATIONS_DETAIL_DATA;
		 				locResponse  = DataTransManager.DataTrans_ForOperationsPopUp(response);
						ActiveAppLocation.Data = response; 
						//var Page = PagesLayout[SERVICE_ORDER];// not used
						//var Tab = TabPages[OPERATION_POPUP];	// not used
						ActiveAppLocation.PageName = PAGE_SERVICEORDER;
						ActiveAppLocation.TabName = PAGE_OPERATIONS;
						ActiveAppLocation.PopUpName = DIV_OPERATIONS_DETAIL_DATA;
						ActiveAppLocation.RefreshTab = false;
						break;
					default:
						return false;
				}
			}
			$("#"+div_content).html("");
			var entry;
			var Id = "";
			var name = "";
			var value = "";
			var API_Name="";
			for (var i = 0, j = locResponse.length; i < j; i++){
				entry = locResponse[i];
				value = entry.sValue; 
				name = entry.Name;
				API_Name = entry.API_Name;
				var newRow;
				var Notes_ID = '';
				var text_area;
				var progress_Value;
				var element;
				var resultRow;
				switch(name){
					case ID_HIDDEN :
					case HIDDEN_RECORD_ID :
						Id = entry.sValue;
						break;
					case HIDDEN_NOTES_ID :
						Notes_ID = entry.sValue;
						break;
					case BREAK_FIELD_NAME:
						newRow = $('<div class="section-delimiter"></div>');
						break;
					case FIELD_NAME_PROGRESS:
						progress_Value = checkFieldValue(value,"integer");
						element = document.getElementById(OPERATION_PROGRESS_TEXT);
						if (element !== null) {
							element.innerHTML = progress_Value+'%';
						}
						progress_Value = checkFieldValue(value,"integer");
						element = document.getElementById('progress_text');
						if (element !== null) {
							element.innerHTML = progress_Value + '%';
						}
						var content_element =  $("#"+DIV_SERVICE_ORDER_PROGRESS_FORM); 
						content_element.html("");
						var div_element = $('<div class="wartsila-slider">' + 
							'<div id="'+DIV_OPERATIONS_PROGRESS_BAR+'" class="example">'+
							'<input type="range"  id="'+INPUT_OPERATIONS_PROGRESS_BAR+'" min="0"'+
							'step="1"  max="100" value="'+progress_Value+'" data-highlight="true" onchange="ActualizeProgress(this)">'+
							'</div>' +
							'</div>');
						content_element.append(div_element);
						content_element.trigger( "create" );
						var ticks  = htmlHeader["OPERATION_POPUP_PROGRESS_BAR"];
						if (ticks !== undefined){
							$("#"+DIV_OPERATIONS_PROGRESS_BAR+" .ui-slider-track").prepend(ticks);
						}
						break;
					case OPERATION_DESCRIPTION_NAME:
						element = document.getElementById(P_SERVICE_ORDER_HEADER_POPUP);
						if (element !== null) {
							element.innerHTML = entry.sValue;
						}
						break;
					case FIELD_NAME_FSC_NOTE:
						text_area = entry.sValue;
						resultRow = '';
						if(isFisrtFSC){
							isFisrtFSC = false;
							resultRow += '<h4> '+entry.Name+' </h4>'+ 
										 '<p></p>';
						}
						newRow = $(resultRow+
							'<div>'+
								'<div>'+
									'<pre>'+
										text_area+
									'</pre>'+
							'</div>'+
						'</div>'
						);
						break;
					case FIELD_NAME_FSE_NOTE:
						var div_css = 'class="operation-div-textarea"';
						text_area = '<textarea id="'+API_Name+'" placeholder="" ';
						text_area +=' class="operations-textarea"  rows="7">';
						text_area +=	entry.sValue + '</textarea>';
						resultRow = '';
						if(isFisrtFSE){
							resultRow += '<h4> '+entry.Name+' </h4>' + '<p></p>';
							isFisrtFSE = false;
						}
						newRow = $(resultRow+
							'<div '+div_css+' >'+
								'<p>'+
									text_area+
								'</p>'+
							'</div>'
						);
						break;
					default:
						newRow = $(
							'<div class="row">' +
								'<div class="label"><p class="no-margin no-padding">' + name + '</p></div>' +
								'<div class="value"><p id="'+API_Name+'" class="no-margin no-padding">' + value + '</p></div> ' +
								'<div class="dotted"></div>' +
							'</div>' 
						);
						break;
				}
				$("#"+div_content).append(newRow);
			}
			$("#"+div_content).trigger("create");
			$( "#operation-popup").popup("open");
		}catch(err){
			LOG.store(err,{"Where":"Operations - onSuccessRetrieveOperationDetail","response":response,"params":params});
		}
	}

	this.OperationPopUp = function(element,id){
		try{
			var ID = '';
			if(id){
				ID = id;
			}else{
				ID = $(element).attr("id"); 
			}
			if(ID){
				var Params = {Ids:[], RecordId : ID,ParentId:"", SQL : "SQLITE_OPERATIONS_DETAIL", Page:"opertations-details"};
				Params.Page = DIV_OPERATIONS_DETAIL_DATA;
				Operations.getSmartStoreData(ID,Params);
			}
		}
		catch(err){
			LOG.store(err,{"Where":"Operations - onSuccessRetrieveOperationDetail","element":element,"id":id});
		}
	};

	this.OperationSaveData = function(){
		try{
			var entryOpperations = [];
			var entryFSE_Notes = [];
			var operation_Id = '';
			var isUpdate = false;
			var Param = jQuery.extend(true, {}, METHOD_PARAMETERS);
			if(ActiveAppLocation!==undefined){
				if( (ActiveAppLocation.PageName == PAGE_SERVICEORDER) && (ActiveAppLocation.TabName == PAGE_OPERATIONS) && 
					(ActiveAppLocation.PopUpName = DIV_OPERATIONS_DETAIL_DATA))
				{
					if(ActiveAppLocation.Data!==undefined){
						var element_ID = '';
						var Page_Element ;
						var key;
						var response = ActiveAppLocation.Data;
						var actDate = new Date();
						var modifyDate;
						var value;
						actDate.setTime( actDate.getTime() + actDate.getTimezoneOffset()*60*1000 );
						var modifyDateTime = DateTimeObject.FormateToStringDB(actDate,'');
						for(var i = 0, j = response.length; i < j; i++){
							var entry = response[i];
							var data = entry[0];
							var FSE_Notes = entry[1];
							var Id = entry[0].Id;
							operation_Id = Id;
							if(data){
								modifyDate= DateTimeObject.FormateToStringDB(actDate,'');
								//data.LastModifiedDate =  modifyDate;
								data.LastModifiedDate = modifyDateTime;
								for(var keys in data){
									if(data.hasOwnProperty(keys)){
										key = data[keys];
										value = '';
										element_ID = keys;
										switch(element_ID){
											case "WRTS_Operation_Progress__c":
												element_ID = INPUT_OPERATIONS_PROGRESS_BAR;
												Page_Element = document.getElementById(element_ID);
												if(Page_Element!==undefined && Page_Element!==null){
													value = Page_Element.value;
													if(value!=key){
														data[keys]=value;
														data.SaveStatus = VALUE_SAVE_LOCAL;
														entryOpperations.push(data);
													}
												}
												break;
											//case "WRTS_Operation_Line_number__c":
											case "WRTS_Operation_Line_number__c":
											case "WRTS_Total_Duration__c":
											case "WRTS_Total_Duration_unit__c":
											case "CKSW__Early_Start_Date__c":
											case "CKSW__Due_Date_Date__c": 
											//At now do nothing because field only as for view
												break;
											default:
												element_ID = '';
												break;
										}
									}
								}
							}
							if(FSE_Notes){
								try{
									FSE_Notes = JSON.parse( FSE_Notes );
								}
								catch(e){
									//some object for login error 
								}
								Id = FSE_Notes.Id;
								modifyDate= DateTimeObject.FormateToStringDB(actDate,'');
								//FSE_Notes.LastModifiedDate =  modifyDate; 
								FSE_Notes.LastModifiedDate = modifyDateTime;
								for (var keys2 in FSE_Notes){
									if(FSE_Notes.hasOwnProperty(keys2)){
										key = FSE_Notes[keys2];
										value = '';
										switch(keys2){
											case "Notes__c":
												element_ID = keys2+API_VALUE_SEPARATOR+Id;
												Page_Element = document.getElementById(element_ID);
												if(Page_Element!==undefined && Page_Element!==null){
													value = Page_Element.value;
													if(value!=key){
														FSE_Notes[keys2]=value;
														FSE_Notes.SyncStatus = VALUE_SAVE_LOCAL;
														entryFSE_Notes.push(FSE_Notes);
													}
												}
												break;
											default:
												break;
										}
									}
								}
							}
							else{
								//check if add new notes
								element_ID = "Notes__c"+API_VALUE_SEPARATOR;
								Page_Element = document.getElementById(element_ID);
								if(Page_Element!==undefined && Page_Element!==null){
									value = Page_Element.value;
									if(value){
										FSE_Notes = jQuery.extend(true, {}, FSE_NOTES_DB); // New FSE Notes
										FSE_Notes.Operation__c = operation_Id;
										FSE_Notes.Notes__c = value;
										FSE_Notes.Id = SmartStoreManager.GeneratorID();
										FSE_Notes.attributes.type = SFDC_FSE_NOTES;
										FSE_Notes.CreatedById = MainObject.userData.Id;
										FSE_Notes.FS_Mobility_ExternalId__c = FSE_Notes.Id+API_VALUE_SEPARATOR+FSE_Notes.CreatedById;
										FSE_Notes.SyncStatus = VALUE_SAVE_LOCAL;
										modifyDate= DateTimeObject.FormateToStringDB(actDate,'');
										//FSE_Notes.LastModifiedDate =  modifyDate;
										FSE_Notes.LastModifiedDate =  modifyDateTime;
										//FSE_Notes.CreatedDate = modifyDate;
										FSE_Notes.CreatedDate = modifyDateTime;
										entryFSE_Notes.push(FSE_Notes);
									}
								}
							}
						}
						if(entryFSE_Notes.length>0){
							Param.Parameters.MethodRunner = "OperationPopUp" ;
							Param.RecordId = operation_Id; 
							SmartStoreManager.SaveBatchTemplate(entryFSE_Notes,SOUP_FSE_NOTES,false,Param);
							isUpdate = true;
						}
						if(entryOpperations.length>0){
							Param.Parameters.MethodRunner = "RefreshContent" ;
							Param.RecordId = ActiveAppLocation.Record.RecordId;
							SmartStoreManager.SaveBatchTemplate(entryOpperations,SOUP_OPERATION_TABLE,false,Param);
							isUpdate = true;
						}
					}
					else{
						alert("No data to save");
					}
				}
			}
		}
		catch(err){
			LOG.store(err,{"Where":"Operations - OperationSaveData"});
		}
	};

}

function ActualizeProgress(element){
	try{
		var activeId = $(element).attr("id");
		var progress_text_ID = activeId+'_text';
		var progress_DOM ;
		var progress_text_DOM = document.getElementById(INPUT_OPERATIONS_PROGRESS_BAR);
		if((progress_text_ID!==undefined) && (activeId!==undefined)){
			progress_DOM =  document.getElementById(OPERATION_PROGRESS_TEXT);
			if((progress_DOM!==undefined) && (progress_text_DOM!==undefined)){
				progress_DOM.innerHTML = progress_text_DOM.value+'%';
			}
		}
	}
	catch(err){
		LOG.store(err,{"Where":"Operations - ActualizeProgress","element":element});
	}
}