/*
  @Author: Kimmo Hovi, 
  @email: kimmo.j.hovi@accenture.com, 
  @LastModified: 17.06.2015; 
  @Description: Controller for the RiskAssessment page
*/

var SiteSafety = new SiteSafetyController();

function SiteSafetyController(){

	var Data = { JSA : {}, chatterItems : [] };

	this.SiteSafetyController = function(serviceOrderId){
		try{
			if(serviceOrderId !== undefined){
				GetSmartStoreData(serviceOrderId);
			}
		}
		catch(err){
			LOG.store(err,{"Where":"SiteSafetyController","serviceOrderId":serviceOrderId});
		}
	};

	function GetSmartStoreData(ServiceOrderId){
		try{
			$( '#site-safety-panel' ).html('');
			var loading = $( '<p>Loading...</p>' );
			$( '#site-safety-panel' ).append(loading);
			var SmartStoreQueryParams = { Ids:[], VariableType : "String", ReplaceValue : ":ServiceOrderId", VariableValue : ServiceOrderId};
			SiteSafety.getSmartStoreData("SQLITE_JOB_SAFETY_ANALYSIS", SmartStoreQueryParams, 
				function(result){
					//Render the data
					var record = result[0];
					if(record !== undefined){
						Data.JSA = record;
						SiteSafety.renderHTML();
						var SQL_PARAMS = SQLTable["SQLITE_JSA_CHATTER"];
						var replaceParams = {Ids:[], VariableType : "String", ReplaceValue : ":RecordId", VariableValue : Data.JSA.Id};
						var QUERY = SQL_PARAMS.SQL + ReplaceSQLParameters(SQL_PARAMS.WHERE, replaceParams) + SQL_PARAMS.ORDERBY;
						logToConsole()("SQLite for  [ " + QUERY + " ]");
						var querySpec = sfSmartstore().buildSmartQuerySpec(QUERY, SQL_PARAMS.LIMIT);
						sfSmartstore().runSmartQuery(querySpec, function(cursor) {
							Data.chatterItems = cursor.currentPageOrderedEntries;
						},function(arr){
							LOG.store(arr,{"Where":"SiteSafetyController - GetSmartStoreData - runSmartQuery","querySpec":querySpec});
						});						
					}
					else{
						$('#site-safety-panel').html('');
						var noRecords = $( '<p>There is no Job Safety Analysis for this service order!<br/>' +
						"Please synchronize the data in the application.<br/>" +
						'If the problem persists, contact your Field Service Coordinator!</p>' );
						$( '#site-safety-panel' ).append(noRecords);
					}
				},
				function(error){
					LOG.store(error,{"Where":"SiteSafetyController - GetSmartStoreData","ServiceOrderId":ServiceOrderId});
				});
		}
		catch(err){
			LOG.store(err,{"Where":"SiteSafetyController - GetSmartStoreData","ServiceOrderId":ServiceOrderId});
		}	
	}

	this.renderHTML = function(){
		try{
			//Find the right panel
			$("#site-safety-panel").html("");
			//Create a table and a body for that table
			var table = $('<table class="wartsila-table-a" border="0" cellpadding="0" cellspacing="0" ></table>' );			
			var tbody = $("<tbody></tbody>");
			var color = "";
			var label = "";
			var status = "";
			var date = "";
			//The HTML structure for a row is defined here!
			//Making a for loop in order to simplify the repetitiveness of the Row-structure
			//There are 12 items in all.
			var firstPotentialRisk;
			for(var i = 0; i < 13; i++){
				//TODO: a switch-case for the different site-safety items
				switch(i){
					case 0:
						label = "Asbestos Free Declaration";
						status = Data.JSA.Asbestos_Free_Certificate_Declaration__c;
						date = "21.03.2014";
						break;
					case 1:
						label = "Dangerous Goods Storage";
						status = Data.JSA.Dangerous_Goods_Storage__c;
						date = "21.03.2014";
						break;
					case 2:
						label = "Emergency Routes and Exits";
						status = Data.JSA.Emergency_Routes_and_Exits__c;
						date = "21.03.2014";
						break;
					case 3:
						label = "Firefighting Equipment";
						status = Data.JSA.Firefighting_quipment__c;
						date = "21.03.2014";
						break;
					case 4:
						label = "General Housekeeping";
						status = Data.JSA.General_Housekeeping_Work_Environment__c;
						date = "21.03.2014";
						break;
					case 5:
						label = "Lifting/Hoisting Equipment";
						status = Data.JSA.lifting_hoisting_equipment__c;
						date = "21.03.2014";
						break;
					case 6:
						label = "Other Hazardous Materials";
						status = Data.JSA.Other_Hazardous_Materials__c;
						date = "21.03.2014";
						break;
					case 7:
						label = "Scaffolding Certificate";
						status = Data.JSA.Scaffolding_Certificate__c;
						date = "21.03.2014";
						break;
					case 8:
						label = "State of Electrical Systems";
						status = Data.JSA.State_of_Electrical_Systems__c;
						date = "21.03.2014";
						break;
					case 9:
						label = "State of Hydraulic Equipment";
						status = Data.JSA.State_of_Hydraulic_Equipments__c;
						date = "21.03.2014";
						break;
					case 10:
						label = "Waste Management";
						status = Data.JSA.Waste_management__c;
						date = "21.03.2014";
						break;
					case 11:
						label = "Ventilation Conditions";
						status = Data.JSA.Ventilation_Conditions__c;
						date = "21.03.2014";
						break;
					case 12:
						label = "Engine Specific Tools";
						status = Data.JSA.Engine_specific_tools__c;
						date = "21.03.2014";
						break;
					default:
						label = "undefined";
						status = "undefined";
						date = "00.00.0000";
						break;
				}
				//Check which color we should have for the status
				if(status === "We can work"){
					color = "";
				}
				else{
					color = "wartsila-orange";
				}
				var newRow = $(
					"<tr onclick='SiteSafety.renderSiteSafetyDetail(\"" + label + "\", \"" + status + "\");'><td>" +
						'<div>'+
							'<div class="row">' +
								'<div class="label"><h3 class="date-head no-margin no-padding">' + label + '</h3></div>' +
							'</div>' +
							'<div class="row">' +
								'<div class="label"><p class="no-margin no-padding">Status</p></div>' +
								'<div class="value"><p id="Test" class="no-margin no-padding ' + color + '">' + status + '</p></div>' +								
								'<div class="dotted"></div>' +
							'</div>' +
						'</div>'+
					'</td></tr>'
				);
				//Check the status and order the items according to that.
				//If the status is "we can work", then the row is inserted at the end.
				//If the status is "potential risk", it is inserted to the top. The first time a potential risk is added,
				//we save the element so that we can insert a "to be checked" status after that one as it moves to the end of the list
				//when new potential risks are added.
				switch(status){
					case "To be checked":
						if(firstPotentialRisk !== undefined)
							newRow.insertAfter(firstPotentialRisk);
						else
							tbody.prepend(newRow);
						break;
					case "Potential Risk":
						tbody.prepend(newRow);
						if(firstPotentialRisk === undefined)
							firstPotentialRisk = newRow;
						break;
					default:
						tbody.append(newRow);
						break;
				}
			}
			table.append(tbody);
			//TODO: add div with date
			$("#site-safety-panel").append(table);
		}
		catch(err){
			LOG.store(err,{"Where":"SiteSafetyController - renderHTML"});
		}
	};
	
	this.SiteSafetyPopUp = function(element){
		try{
			SiteSafety.renderSiteSafetyDetail();
		}
		catch(err){ 
			LOG.store(err,{"Where":"SiteSafetyController - SiteSafetyPopUp","element":element});
		}
	};

	this.renderSiteSafetyDetail = function(label, status){
		try{
			$("#safety-popup").html('');
			var updatedDate = "";
			var commentRows = "";
			if(Data.chatterItems !== undefined){
				//parse the FSC notes of the site safety items
				var posts = [];
				for(var i = 0, j = Data.chatterItems.length; i < j; i++){
					//Todo: Add a general remarks comment?
					if(Data.chatterItems[i][0].Body !== null && Data.chatterItems[i][0].Body.indexOf("[" + label + "]") > -1){
						//check which comments (if any) are written for this site safety Item.
						posts.push(Data.chatterItems[i][0]);
					}
				}
				for(var k = 0, l = posts.length; k < l; k++){
					var Feed = posts[k];
					var ContentFileName = Feed.ContentFileName;
					var feed_file = "";
					if (ContentFileName !== undefined && ContentFileName !== null && ContentFileName !== VALUE_EMPTY) {
						var FileName = "[" + Feed.Id + "]" + ContentFileName;
						var abPath = DEFAULT_FILE_PATH + FileName;
						var fileTypeVector = FileName.split(".");
						var lastIndex = fileTypeVector.length -1;
						if(lastIndex === 0){
							//File without extension
							throw FileName + " has no file extension";
						}
						var extension = fileTypeVector[lastIndex].toLowerCase();
						if(extension === "jpg" || extension === "jpeg" ||extension === "png" || extension === "gif")
							feed_file = "<p class='center'><img src=\"" + abPath + "\"  onclick='FileManager.OpenLocalFile(" + JSON.stringify(FileName) + ")' style=\"width:90%;\"/></p>";
          			}
					if(Feed.pictureUri !== undefined){
						feed_file = "<p class='center'><img src=\"" + Feed.pictureUri + "\" onclick='window.open(\"" + Feed.pictureUri + "\", \"_blank\")' style=\"width:90%;\"\></p>";
					}
					//Create a paragraph with the feed body, but remove the tag from it.
					commentRows += '<div class="row">' +
						feed_file +
						'<p>' + Feed.Body.replace("[" + label + "]","") + '</p>' +
					'</div>';
				}
				if(commentRows !== ""){
					updatedDate = posts[0].CreatedDate;
					commentRows = '<div class="row">' +
					'<p class="label"><h3 class="date-head no-margin no-padding">Description</h3></p>' +
				'</div>' + commentRows;
				}
			}
			if(updatedDate === ""){
				//JSA UpdatedDate
				updatedDate = Data.JSA.LastModifiedDate;
			}
			updatedDate = updatedDate.split("T")[0];
			var splitUpdatedDate = updatedDate.split("-");
			updatedDate = splitUpdatedDate[2] + "." + splitUpdatedDate[1] + "." + splitUpdatedDate[0];

			var slideValue = 0;
			switch(status){
				case "Potential Risk":
					slideValue = 0;
					break;
				case "To be checked":
					slideValue = 1;
					break;
				case "We can work":
					slideValue = 2;
					break;
				default:
					break;
			}
			var generalRemarks = Data.JSA.Installation_EHS_conditions_notes__c;
			if(!generalRemarks){
				generalRemarks = "There are no remarks done for this job safety analysis.";
			}
			var content = '<a href="#" id="closeSafetyPopup" data-rel="back"  data-theme="a" data-iconpos="notext" class="ui-btn-right">' +
				'<img src="images/icons/close-button-32.png" />' +
			"</a>" +
			'<div class="wartsila-detail-list" >' + 
				'<div class="row">' +
					"<h3 id='siteSafetyLabel'>" + label + "</h3>" +
				'</div>' +
				'<div class="row">' +
					'<div class="label"><p class="no-margin no-padding">Updated</p></div>' +
					'<div class="value"><p class="no-margin no-padding">' + updatedDate + '</p></div>' +								
					'<div class="dotted"></div>' +
				'</div>' +
				'<div class="row">' +
					'<p class="padTopHalf">' + 
						'<div class="site-safety-slider">'+
							/*'<input id="siteSafetySlider" type="range" min="0" step="1" max="2" onchange="
							SiteSafety.sliderChanged(\'' + label + '\', this.value);" value="' + slideValue + '" data-highlight="true">'+*/
						'</div>' +
					'</p>' +
				'</div>'+
				'<div class="row">' +
					'<p class="padTopHalf"><h3 class="date-head no-margin no-padding">General remarks</h3></p>' +
					'<div style="width:2000px;"></div>'+
				'</div>' +
				'<div class="row">' +
					'<p>' + generalRemarks + '</p>' +
				'</div>' +
				commentRows +
			'</div>';
			var cameraButton = "<div id='cameraDiv' class='float-left'><img src='images/icons/picture40x28.png' onclick='SiteSafety.takePicture()'/></div>";
			var commentSection = "<div>" +
							"<div>" +
								"<textarea id='JSAComment' safetyItem='" + label + "' placeholder='Tell about your observations...' class='comment-box'  rows='3'>" +
								"</textarea>" +
							"</div>" +
							"<div id='pictureDiv'>" +
							"</div>" +
							"<div>" +
								"<div class='wartsila-btn orange float-right' onclick='SiteSafety.ShareComment()'>Save</div>" +
								cameraButton +
								"<div class='clear-both'></div>" +
							"</div>" +	
						"</div>";
			$("#safety-popup").append(content);
			$(".site-safety-slider").pipSlider({
				min : 0,
				max : 2,
				value : slideValue,
				change: function( e, ui ) {
					SiteSafety.sliderChanged(ui.value);
				}
			}).pipSlider("pips",{
				rest : "label",
				labels : ["Potential risk", "To be checked", "We can work"]
			});
			$("#safety-popup").append(commentSection);
			$("#safety-popup").trigger( "create" );
			$("#safety-popup").popup( "open" );
		}
		catch(err){
			LOG.store(err,{"Where":"SiteSafetyController - renderSiteSafetyDetail","label":label,"status":status});
		}
	};
	
	this.sliderChanged = function(value){
		try{
			var label = $("#siteSafetyLabel").html();
			var status = "Default!";
			switch(value){
				case 0:
					status = "Potential Risk";
					break;
				case 1:
					status = "To be checked";
					break;
				case 2:
					status = "We can work";
					break;
				default:
					status = "Error!";
					break;
			}
			switch(label){
				case "Dangerous Goods Storage":
					Data.JSA.Dangerous_Goods_Storage__c = status;
					break;
				case "State of Hydraulic Equipment":
					Data.JSA.State_of_Hydraulic_Equipments__c = status;
					break;
				case "State of Electrical Systems":
					Data.JSA.State_of_Electrical_Systems__c = status;
					break;
				case "Lifting/Hoisting Equipment":
					Data.JSA.lifting_hoisting_equipment__c = status;
					break;
				case "General Housekeeping":
					Data.JSA.General_Housekeeping_Work_Environment__c = status;
					break;
				case "Asbestos Free Declaration":
					Data.JSA.Asbestos_Free_Certificate_Declaration__c = status;
					break;
				case "Emergency Routes and Exits":
					Data.JSA.Emergency_Routes_and_Exits__c = status;
					break;
				case "Firefighting Equipment":
					Data.JSA.Firefighting_quipment__c = status;
					break;
				case "Other Hazardous Materials":
					Data.JSA.Other_Hazardous_Materials__c = status;
					break;
				case "Scaffolding Certificate":
					Data.JSA.Scaffolding_Certificate__c = status;
					break;
				case "Waste Management":
					Data.JSA.Waste_management__c = status;
					break;
				case "Ventilation Conditions":
					Data.JSA.Ventilation_Conditions__c = status;
					break;
				case "Engine Specific Tools":
					Data.JSA.Engine_specific_tools__c = status;
					break;
				default:
					alert("Default!");
					break;
			}
			//Save data to SmartStore
			Data.JSA.SaveStatus = VALUE_UPDATED;
			SmartStoreManager.SaveBatchTemplate([Data.JSA], SOUP_JOB_SAFETY_ANALYSIS_TABLE, false, undefined);
			SiteSafety.renderHTML();
		}catch(err){
			LOG.store(err,{"Where":"SiteSafetyController - sliderChanged","value":value});
		}
	};
	
	this.ShareComment = function(){
		try{
			var safetyStatus = "";
			//We need this for later when we want to refresh the page.
			switch($("#siteSafetySlider").val()){
				case 0:
					safetyStatus = "Potential Risk";
					break;
				case 1:
					safetyStatus = "To be checked";
					break;
				default:
					safetyStatus = "We can work";
					break;
			}
			var pictureAnchor = $("#pictureLink");
			var pictureUri;
			if(pictureAnchor !== undefined){
				pictureUri = pictureAnchor.attr("pictureUri");
			}
			var entries = [];
			var body = $("#JSAComment").val();
			var SafetyItem = $("#JSAComment").attr("safetyItem");
			if(body === ""){
				alert("Please write something first!");
				return;
			}
			body = "[" + SafetyItem + "]" + body;
			
			var entry = jQuery.extend(true, {}, FEED_ITEM); //clone JSON object
			entry.Body = body;
			entry.InsertedById = MainObject.userData.Id;
			entry.attributes.type = SOUP_JOB_SAFETY_ANALYSIS_FEED;
			
			var actDate = new Date();
			var createdDate = DateTimeObject.FormateToStringDB(actDate,'');
			
			if(pictureUri !== undefined){
				entry.pictureUri = pictureUri;
			}
			
			entry.SaveStatus = VALUE_SAVE_LOCAL;
			entry.isDownloaded = VALUE_NO;
			entry.ParentId = Data.JSA.Id;
		
			entry.Id = SmartStoreManager.GeneratorID();
			entry.CreatedDate = createdDate;
			entries.push(entry);
			//Push the newly created item also to the local data to avoid fetching it from SmartStore again.
			Data.chatterItems.push([entry]);
			if(entries.length > 0){
				//var myParameters = {Parameters:{ "MethodRunner":""},"RecordId":Data.JSA.Id,"ParentId":Data.JSA.Id};
				SmartStoreManager.SaveBatchTemplate(entries,SOUP_JOB_SAFETY_ANALYSIS_FEED,false, undefined);
				document.getElementById("closeSafetyPopup").click();
			}
		}catch(err){
			LOG.store(err,{"Where":"SiteSafetyController - sliderChanged"});
		}
	};
	
	this.removePicture = function(){
		$("#pictureDiv").empty();
		$("#cameraDiv").append("<img src='images/icons/picture34x32.png' onclick='SiteSafety.takePicture()'/>");
		$("#safety-popup").trigger("create");
	};

	this.takePicture = function(){
		try{
			//taking picture
			navigator.camera.getPicture(function(success){
				//Callback function on successful picture
				var pictureFileName = success.substring(success.lastIndexOf('/') + 1);
				var pictureContent = "<p class='float-left'><a href='#' id='pictureLink' pictureUri=\"" + success + 
					"\" onclick='window.open(\"" + success + "\", \"_blank\")'>" + pictureFileName + "</a></p>" + 
						"<p class='float-right'><a href='#' onclick='SiteSafety.removePicture()'>Delete</a></p>" +
						"<div class='clear-both'></div>";
				$("#pictureDiv").append(pictureContent);
				$("#cameraDiv").empty();
				$("#safety-popup").trigger("create");
			}, 
			function(fail)
			{
				//Canceled
				//Callback when picture failed
			}, 
			{ 
				quality: 25, 
				destinationType : navigator.camera.DestinationType.FILE_URI 
			});
		}
		catch(err){
			LOG.handle(err,"SiteSafetyController method takePicture raised an error: " + err.message);
		}
	};

	//A function that gets the data needed from SmartStore. This is probably quite generic.
	//@param SQLitenQueryName is the name of the SQLite query in SQLTable (defined in database.js)
	//@param SmartStoreQueryParams are the parameters for the SQLite query e.g { Ids:[], VariableType : "String", ReplaceValue : ":ServiceOrderId", VariableValue : serviceOrderId};
	//@param successCallback is the function called upon successful query
	//@param failCallback is the function called upon failure
	this.getSmartStoreData = function(SQLiteQueryName, SmartStoreQueryParams, successCallback, failCallback){
		try{
			var SQL_PARAMS = SQLTable[SQLiteQueryName];
			var iLimit = SQL_PARAMS.LIMIT;
			var sWHERE = SQL_PARAMS.WHERE; 
			var sORDERBY = SQL_PARAMS.ORDERBY;
			var SOUP_SQL = SQL_PARAMS.SQL;
			var WHERE = ReplaceSQLParameters(sWHERE, SmartStoreQueryParams);
				
			var QuerySpec = sfSmartstore().buildSmartQuerySpec(SOUP_SQL + WHERE + sORDERBY, iLimit);
			sfSmartstore().runSmartQuery(QuerySpec, 
				function(result){
					//The records from SmartStore are delivered as an array of arrays containing a single object.
					//The following few lines modify the result to have the same form as forcetkClients results.
					//This to make it possible to also deliver results straight from forcetkClient without using SmartStore (when online)
					var records = [];
					$.each(result.currentPageOrderedEntries, function(i, SmartStoreData){
						records.push(SmartStoreData[0]);
					});
					successCallback(records);
				}, 
				function(err){
					failCallback(err);
				});
		}
		catch(err){
			LOG.store(err,{"Where":"SiteSafetyController - getSmartStoreData","SQLiteQueryName":SQLiteQueryName,"SmartStoreQueryParams":SmartStoreQueryParams,"successCallback":successCallback,"failCallback":failCallback});
			failCallback(err);
		}
	};
}