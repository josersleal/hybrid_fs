/*
  @Author: Kimmo Hovi, 
  @email: kimmo.j.hovi@accenture.com, 
  @Version: 1.0
  @LastModified: 17.06.2015; 
  @Description: Controller for the RiskAssessment page

*/

var Incidents = new IncidentController();

function IncidentController(){
	
	var Data = { jsaActivities:[], Resources:[], Incidents:[], ServiceOrder : {}, InstallationId : {} };
	var queriesInProgress = 0;

	this.IncidentController = function(serviceOrderId){
		var SmartStoreQueryParams = { Ids:[], VariableType : "String", ReplaceValue : ":RecordId", VariableValue : serviceOrderId };
			Incidents.getSmartStoreData("SQLITE_WORK_ORDER_DETAIL", SmartStoreQueryParams, 
				function(result){
					Data.ServiceOrder = result[0];
					Incidents.RefreshContent();
				},
				function(err){
					LOG.store(err,{"Where":"IncidentController","serviceOrderId":serviceOrderId});
				});
		Data.ServiceOrderId = serviceOrderId;
	};
	
	this.renderList = function(){
		try{
			$("#incident-panel").empty();
			if(Data.jsaActivities.length === 0){
				var noRecords = $( '<p>There are no Job Safety Analysis Activities for this service order!<br/>' +
							"Please synchronize the data in the application.<br/>" +
							'If the problem persists, contact your Field Service Coordinator!</p>' );
				$("#incident-panel").append(noRecords);
				$("#incident-panel").trigger("create");
				return;
			}
			var table = $('<table class="wartsila-table-a" border="0" cellpadding="0" cellspacing="0" ></table>' );
			var tbody = $("<tbody></tbody>");
			$.each(Data.Incidents, function(i, SFDCdata) {
					var record = SFDCdata;
					var date = record.CreatedDate.split('T')[0];
					var splitted = date.split('-');
					date = splitted[2] + "." + splitted[1] + "." + splitted[0];
					var newRow = "";
					if (record !== undefined && record !== null) {
						newRow = "<tr><td>" + 
							"<p><b>" + date + "</b> " + record.Incident_type__c +"</p>" +
							"<p><b>Activity name:</b> " + record.Activity_name__c + 
							"<br/><b>Severity:</b> " + record.Risk_Potential__c + "</p>" +
						"</td></tr>";
					}
					tbody.append(newRow);
			});
			table.append(tbody);
			$("#incident-panel").append("<div class='wartsila-btn orange' onclick='Incidents.renderHTML();'>Report an incident</div>");
			$("#incident-panel").append(table);
			$("#incident-panel").trigger("create");
		}catch(err){
			LOG.store(err,{"Where":"IncidentController - renderList"});
		}
	};

	this.renderHTML = function(){
		try{
			$("#safety-popup").html('');
			var JSA_activity_options = '<option value="">--- Activity Name ---</option>';
			$.each(Data.jsaActivities, function(i, SFDCdata){
				//each item is an array with a single item! Hence the braces.
				var record = SFDCdata;
				if(record){
					JSA_activity_options += '<option value="' + record.Id + '">' + record.RA_Activity__r.Short_Activity_Title__c + '</option>';
				}
			});
			var resource_options = '<option value="">--- Observer/Involved resource ---</option>';
			$.each(Data.Resources, function(i, SFDCdata){
				//each item is an array with a single item! Hence the braces.
				var record = SFDCdata;
				if(record){
					resource_options += '<option value="' + record.CKSW__User__c + '">' + record.Name + '</option>';
				}
			});
			var selects = '<select name="incidentType" id="incidentType">'+
								'<option value="">--- Incident Type ---</option>' +
								'<option value="Environmental incident or fire">Environmental incident or fire</option>'+
								'<option value="Hazard observation">Hazard observation</option>'+
								'<option value="Near miss">Near miss</option>'+
								'<option value="Occupational injury">Occupational injury</option>' +
								'<option value="Spare parts not supplied by Wärtsilä">Spare parts not supplied by Wärtsilä</option>' +
								'<option value="Security event">Security event</option>'+
							'</select>'+
							'<select id="riskLevel" name="riskLevel">'+
								'<option value="">--- Risk Level ---</option>'+
								'<option value="1 Insignificant">1 Insignificant</option>'+
								'<option value="2 Minor">2 Minor</option>'+
								'<option value="3 Moderate">3 Moderate</option>'+
								'<option value="4 Major">4 Major</option>'+
								'<option value="5 Critical">5 Critical</option>'+
							'</select>'+
							'<select id="jsaActivity" name="jsaActivity">'+
								JSA_activity_options +
							'</select>' +
							'<select id="involvedParties" name="involvedParties">'+
								'<option value="">--- Involved Parties ---</option>'+
								'<option value="Internal (only)">Internal</option>'+
								'<option value="External (only)">External</option>'+
							'</select>'+
							'<select id="observer" name="observer">'+
								resource_options +
							'</select>'+
							'<input type="text" id="involvedPerson" placeholder="Involved person"/>';

			var content = '<a href="#" id="closePopup" data-rel="back"  data-theme="a" data-iconpos="notext" class="ui-btn-right">' +
								'<img src="images/icons/close-button-32.png" />' +
						  '</a><br/>' +
						'<div style="width:2000px;"></div>'+
						'<div class="ui-field-contain">' +
						'<form id="incidentForm">'+
							selects +
							"<div>" +
									'<textarea name="incidentDescription" id="incidentDescription" class="feed-box" placeholder="Describe the incident..." rows="5">' +
									"</textarea>" +
							"</div>" +
							'<div id="pictures" class="row">' +
							'</div>' +
							"<div>" +
								"<div class='float-right'><img src='images/icons/picture40x28.png' onclick='Incidents.takePicture();'/></div>" +
								"<div class='clear-both'></div>" +
							"</div>" +
							'<input type="checkbox" name="checkbox-0" id="workStopped" class="custom" data-mini="true"/>' +
							'<label for="workStopped">Work was stopped due to incident</label>' +
							"<div class='wartsila-btn orange' onclick='Incidents.reportIncident();'>Report the incident</div>" +
						'</form>'+
						'</div>';
			$("#safety-popup").append(content);
			$("#safety-popup").trigger("create");
			$("#safety-popup").popup("open");
		}catch(err){
			LOG.store(err,{"Where":"IncidentController - renderHTML"});
		}
	};

	this.RefreshContent = function(){
		try{
			$("#safety-popup").popup("close");
			if(Data.ServiceOrderId !== undefined){
				queriesInProgress = 3;
				var SmartStoreQueryParams = { Ids:[], VariableType : "String", ReplaceValue : ":ServiceOrderId", VariableValue : Data.ServiceOrder.Id };
				Incidents.getSmartStoreData("SQLITE_JSA_ACTIVITIES", SmartStoreQueryParams, 
					function(result){
						//Render the data
						Data.jsaActivities = result;
						queriesInProgress--;
						//Check whether all queries are done.
						if(queriesInProgress === 0)
							Incidents.renderList();
					}, 
					function(err){
						LOG.store(err,{"Where":"IncidentController - RefreshContent - SQLITE_JSA_ACTIVITIES"});
					}
				);
				SmartStoreQueryParams = { Ids:[], VariableType : "String", ReplaceValue : ":ServiceOrderId", VariableValue : Data.ServiceOrder.Id };
				Incidents.getSmartStoreData("SQLITE_RESOURCE", SmartStoreQueryParams, 
					function(result){
						//Render the data
						Data.Resources = result;
						queriesInProgress--;
						if(queriesInProgress === 0)
							Incidents.renderList();
					}, 
					function(err){
						LOG.store(err,{"Where":"IncidentController - RefreshContent - SQLITE_RESOURCE"});
					}
				);
				SmartStoreQueryParams = { Ids:[], VariableType : "String", ReplaceValue : ":InstallationId", VariableValue : Data.ServiceOrder.WRTS_Installation_ID__c };
				Incidents.getSmartStoreData("SQLITE_INCIDENTS", SmartStoreQueryParams, 
					function(result){
						//Render the data
						Data.Incidents = result;
						queriesInProgress--;
						if(queriesInProgress === 0)
							Incidents.renderList();
					}, 
					function(err){
						LOG.store(err,{"Where":"IncidentController - RefreshContent - SQLITE_INCIDENTS"});
					}
				);
			}
		}catch(err){
			LOG.store(err,{"Where":"IncidentController - RefreshContent"});
		}
	};
	
	this.updatePictures = function(pictureUri, deletePicture){
		try{
			if(pictureUri !== undefined){
				var pictureFileName = pictureUri.substring(pictureUri.lastIndexOf('/') + 1);
				var pictureId = pictureFileName.substring(0, pictureFileName.lastIndexOf('.'));
				//var pictureRowContent = $("#pictures").html();
				if(deletePicture !== undefined && deletePicture === true){
					//The picture is to be deleted from the UI
					$("#" + pictureId).remove();
				}
				else{
					//The picture is to be added in the UI
					var pictureRow = '<div id="' + pictureId + '">' +
									"<p class='float-left'><a class='incidentPicture' uri=\"" + pictureUri + "\" onclick='window.open(\"" + pictureUri + "\", \"_blank\")'>" + pictureFileName + "</a></p>" + 
									"<p class='float-right'><a href='#' onclick='Incidents.updatePictures(\"" + pictureUri + "\", true);'>Delete</a></p>" +
									"<div class='clear-both'></div>" +
								"</div>";
					$("#pictures").append(pictureRow);
				}
				$("#pictures").trigger("create");
			}
		}catch(err){
			LOG.store(err,{"Where":"IncidentController - updatePictures","pictureUri":pictureUri,"deletePicture":deletePicture});
		}
	};
	
	this.takePicture =  function(){
		try{
			navigator.camera.getPicture(function(success){
				//Callback function on successful picture
				Incidents.updatePictures(success, false);
			}, 
			function(fail){
				//Callback when picture failed
			}, 
			{ 
				quality: 25, 
				destinationType : navigator.camera.DestinationType.FILE_URI 
			});
		}
		catch(err){
			LOG.store(err,{"Where":"IncidentController - takePicture"});
		}
	};
	
	this.reportIncident = function(){
		try{
			//var incidentForm = $("#incidentForm");
			var incidentType = $("#incidentType").val();
			var involvedParties = $("#involvedParties").val();
			var observer = $("#observer").val();
			var person = $("#involvedPerson").val();
			var riskLevel = $("#riskLevel").val();
			var incidentDescription = $("#incidentDescription").val();
			var JSAactivity = $("#jsaActivity").val();
			var workStopped = $("#workStopped").is(':checked');

			//Validation checks

			if(!incidentType){
				alert("Incident Type must be filled!");
				return;
			}
			if(!riskLevel){
				alert("Risk Level must be filled!");
				return;
			}
			if(!JSAactivity){
				alert("Activity Name must be filled!");
				return;
			}
			if(!involvedParties){
				alert("Involved Parties must be filled!");
				return;
			}
			if(involvedParties === "Internal (only)" && (observer === undefined || observer === "")){
				alert("Observer/Involved resource must be filled when involved party is internal!");
				return;
			}
			if(involvedParties === "External (only)" && (person === undefined || person === "")){
				alert("Involved person must be filled when involved party is external!");
				return;
			}
			if(!incidentDescription){
				alert("Please describe the incident!");
				return;
			}

			//Get all pictureUris
			var pictureUris = "";
			$(".incidentPicture").each(function(){
				pictureUris += $(this).attr("uri") + ";";
			});
			//Remove last semicolon from pictureUris
			if(pictureUris !== "")
				pictureUris = pictureUris.slice(0, -1);
			var entries = [];
			var entry = jQuery.extend(true, {}, INCIDENT);
      		entry.InsertedById = MainObject.userData.Id;
			entry.PictureUris = pictureUris;
			entry.Incident_Summary__c = incidentDescription;
			entry.Incident_type__c = incidentType;
			entry.Observer_Involved_Resource__c = observer;
			entry.observer_involved_person__c = person;
			entry.Work_stopped_due_incident__c = workStopped;
			entry.Risk_Potential__c = riskLevel;
			entry.Involved_parties__c = involvedParties;
			entry.JSA_Activity__c = JSAactivity;
			entry.Installation__c = Data.ServiceOrder.WRTS_Installation_ID__c;

			$.each(Data.jsaActivities, function(i, SFDCdata) {
				//each item is an array with a single item! Hence the braces.
				var record = SFDCdata;
				if ( record !== undefined && record !== null && record.Id === JSAactivity) {
					entry.Activity_name__c = record.RA_Activity__r.Short_Activity_Title__c;
				}
			});

      		var actDate = new Date();
      		var createdDate = DateTimeObject.FormateToStringDB(actDate,'');
			entry.SaveStatus = VALUE_SAVE_LOCAL;
			entry.isDownloaded = VALUE_NO;
			entry.Id = SmartStoreManager.GeneratorID();
			entry.CreatedDate = createdDate;
			entries.push(entry);
			if(entries.length > 0){
				var myParameters = {Parameters:{ "MethodRunner":"IncidentReported"},"RecordId":""};
				SmartStoreManager.SaveBatchTemplate(entries, SOUP_INCIDENT_TABLE ,false, myParameters);
			}
			window.scrollTo(0, 0);
			Incidents.RefreshContent();
		}
		catch(err){
			LOG.store(err,{"Where":"IncidentController - reportIncident"});
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
					LOG.store(err,{"Where":"IncidentController - getSmartStoreData - runSmartQuery","QuerySpec":QuerySpec});
					failCallback(err);
				});
		}
		catch(err){
			LOG.store(err,{"Where":"IncidentController - getSmartStoreData","SQLiteQueryName":SQLiteQueryName,"SmartStoreQueryParams":SmartStoreQueryParams});
			failCallback(err);
		}
	};
}