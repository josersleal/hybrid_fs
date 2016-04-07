/*
  @Author: Juraj Ciljak, 
  @email:juraj.ciljak@accenture.com,
  @Description: Controller for Chatter page
*/

var Chatters = new Chatter();

function Chatter(){

	"use strict";

	var CHATT_PANEL = "chat-panel";
	var CLASS_NAME 	= "ChatterController";
	var RecordId 	= "";
	var Parameters 	= {};
	var ParentId	= "";

	this.ChatterController = function(parameters){
		try{
			ClearChatter();
			Parameters = parameters;
			if(parameters!==undefined){
				RecordId = Parameters.RecordId;
				ParentId = Parameters.ParentId;
				getSmartStoreData();
			}
		}
		catch(err){
			LOG.handle(err,'Class ' + CLASS_NAME + ', method ChatterController raised error:'+err.message,parameters);
		}
	};

	function ClearChatter(){
		try{
			RecordId = "";
			Parameters = {};
			ParentId = "";
		}
		catch(err){
			LOG.handle(err,'Class ' + CLASS_NAME + ', method ClearChatter raised error:'+err.message);
		}
	}

	function getSmartStoreData(){
		try{
			var SQL_PARAMS = SQLTable[Parameters.SQL];
			var replaceParams = {Ids:[], VariableType : "String", ReplaceValue : ":RecordId", VariableValue : ParentId};
			var QUERY = SQL_PARAMS.SQL + ReplaceSQLParameters(SQL_PARAMS.WHERE, replaceParams) + SQL_PARAMS.ORDERBY;
			var querySpec = sfSmartstore().buildSmartQuerySpec(QUERY, SQL_PARAMS.LIMIT);
			sfSmartstore().runSmartQuery(querySpec, function(cursor) {
				var page = cursor.currentPageOrderedEntries;
				onSuccessSPDataRetrieve(page,CHATT_PANEL);
			},function(error){LOG.handle(error,"Error with sfSmartstore and Chatter",querySpec);});
		}
		catch(err){
			LOG.handle(err,'Class ' + CLASS_NAME + ', method getSmartStoreData raised an error: ' + err.message,Parameters);
		}
	}

	this.SaveFeed = function(){
		try{
			var wo_feed = {};
			wo_feed.ParentId = this.ParentId;
			wo_feed.Id ='';
			var feed = document.getElementById('feed');
			var body='';
			if (feed!==undefined)
			{
				body = feed.value;
			}
			wo_feed.Body=body;
			forcetkClient.postChatterItem(wo_feed.ParentId,wo_feed.Body,function(sc){},function(err){
				LOG.handle(err,"Error during Saving of Feed:\n"+err);
			});
		}
		catch(err){
			LOG.handle(err,"Error in ChatterController.SaveFeed");
		}
	};

	function onSuccessSPDataRetrieve(response, div_content) {
		try {
			$("#"+div_content).html("");
			var conversationPanel = $("<div class='conversation-panel' ></div>" );
			$( "#" + div_content).append(conversationPanel);
			//Sanitize the response data by removing unwanted fields and parsing the wanted.
			var Result = DataTransManager.DataTrans_ForServiceOrderChatt(response);
			var feed_comments = '';
			var urlListeners = {URL:[],Counter:0};
			if (Result !== undefined && Result !== null) {
				for (var items in Result) {
					if(Result.hasOwnProperty(items)){
						var Feed = Result[items];
						var feed_file='';
						var FeedComments = Feed.FeedComments;
						var ContentFileName = Feed.ContentFileName; 
						var UserName = Feed.UserName;
						var Body = Feed.Body;
						var createdDate = Feed.CreatedDate;
						if (ContentFileName != VALUE_EMPTY) {
							var FileName = "[" + Feed.Id + "]" + ContentFileName;
							if(isPicture(FileName)){
								var abPath = DEFAULT_FILE_PATH + FileName;
								feed_file = "<p><img src=\"" + abPath + "\" onclick='FileManager.OpenLocalFile(" + JSON.stringify(FileName) + ")' style=\"width:100%;\"/></p>";
							}else{
								feed_file = "<p><a href='#' onclick='FileManager.OpenLocalFile(" + JSON.stringify(FileName) + ")'>" + ContentFileName + "</a></p>";
							}
						}
						else if(Feed.pictureUri !== undefined && Feed.pictureUri !== "")
						{
							ContentFileName = Feed.pictureUri.substring(Feed.pictureUri.lastIndexOf('/') + 1);
							if(isPicture(ContentFileName)){
								feed_file = "<p><img src=\"" + Feed.pictureUri + "\" onclick='window.open(\"" + Feed.pictureUri + ")' style=\"width:100%;\"/></p>";
							}else{
								feed_file = "<p><a href='#' onclick='window.open(\"" + Feed.pictureUri + "\", \"_blank\")'>PIC:" + ContentFileName + "</a></p>";
							}
						}
						feed_comments = "";
						var Comments, CommentsUserName;
						for (var line_items in FeedComments){
							if(FeedComments.hasOwnProperty(line_items)){
								//TODO: get the attachments for comments...
								Comments = FeedComments[line_items];
								CommentsUserName = Comments.UserName;
								var commentClass = (Comments.isMyComment?' my-comment':'');
								feed_comments += "<div class='comment-row border-color-light-grey"+commentClass+"'>" + 
													"<p class='small no-margin no-padding'>" + CommentsUserName + "</p>" +
													"<p>" + replaceStringURLs(Comments.CommentBody,urlListeners) + "</p>" +
													"<p class='align-right small no-margin no-padding'>" + Comments.CreatedDate + "</p>" +
													"<div class='clear-both'></div>" +
												 "</div>";
							}
						}
						var feedClass = (Feed.isMyComment?' my-comment':'');
						var newRow = $("<div class='chat-bubble incoming-message"+feedClass+"'></div>");
						newRow.append("<p class='small no-margin no-padding'>" + UserName + "</p>");
						var newRowMessage = $("<div class='message'></div>");
						var bodyContainer = $("<p></p>");
						bodyContainer.append(replaceStringURLs(Body,urlListeners));
						newRowMessage.append(bodyContainer);
						newRowMessage.append("<p class='small no-margin no-padding'>" + createdDate + "</p>");
						newRowMessage.append("<div class='attachment-container'>" + feed_file + "</div>");
						newRowMessage.append("<div class='comments-container'>" + feed_comments + "</div>");
						newRow.append(newRowMessage);
						var feedFooter = $("<div class='feed-post-footer'></div>");
						feedFooter.append("<p class='wartsila-orange no-margin no-padding' id='comment_"+ Feed.Id + "' onclick='Chatters.ToggleEditBox(this)'>Comment</p>");
						feedFooter.append("<div class='comment-section' id='comment_" + Feed.Id + "_editBox'></div>");
						feedFooter.append("<div class='clear-both'></div>");
						newRow.append(feedFooter);
						conversationPanel.append(newRow);
					}
				}
			}
			$("#"+div_content).append(conversationPanel);
			//$.when(	//THIS WAS TO ENSURE THAT EventListeners are added after elements are created
				$("#"+div_content).trigger( "create" );
				//).done(function(){addListeners2ReplacedUrls(urlListeners);});
		}
		catch(err){
			LOG.handle(err,"Error in Chatter.onSuccessSPDataRetrieve",{"response":response, "div_content":div_content});
		}
	}

	function replaceStringURLs(inputText,urlListeners){
		var result = '', lines, words, word, replacement;//, onclck;
		var replaceRegex = '(https?:\/\/(?:www\.|(?!www))[^\s\.]+\.[^\s\/]{2,}|www\.[^\s]+\.[^\s\/]{2,})';
		try{
			lines = inputText.split('\n');
			for(var i=0,j=lines.length;i<j;i++){
				words = lines[i].split(' ');
				if(i>0){
					result += '<br/>';
				}
				for(var k=0,l=words.length;k<l;k++){
					if(k>0){
						result += ' ';
					}
					word = words[k];
					if(word.match(replaceRegex)){
						//PLEASE KEEP THIS FOR A WHILE, IN CASE THAT FIX IS NEEDED
						//onclck = 'openURL("'+word+'"");';
						//replacement = "<a href='#' onclick='"+onclck+"'>"+word+"</a>";
						//replacement = "<a href='#' data-rel='external' id='replacedUrl"+urlListeners.Counter+"'>"+word+"</a>";
						//urlListeners.URL.push(word);
						//urlListeners.Counter++;
						//replacement = "<a href='"+word+"' data-rel='external' >"+word+"</a>";
						if(word.indexOf('www')===0){
							replacement = 'http://'+word;//URLs without HTTP or HTTPS Will not be opened!!!
						}else{
							replacement = word;
						}
						replacement = "<a href='#' data-rel='external' onclick='window.open(\""+replacement+"\",\"_system\",\"location=yes\");'>"+word+"</a>";
						word = replacement;
					}
					result += word;
				}
			}
		}catch(err){
			LOG.handle(err,"Could not replace URL in this:\n"+inputText,inputText);
		}
		return result;
	}

	//IF NO FIX NOR WORKAROUND NEEDED, delete this
	function openURL(url){
		try{
			window.open("'"+url+"'",'_system');
		}catch(err){
			LOG.handle(err,"Could not open URL:\n"+url);
		}
	}

	//IF NO FIX NOR WORKAROUND NEEDED, delete this
	function addListeners2ReplacedUrls(urlListeners){
		try{
			var url;
			for(var i=0;i<urlListeners.Counter;i++){
				url = urlListeners.URL[i];
				document.getElementById("replacedUrl"+i).onclick = function(){
					window.open("'"+url+"'",'_system');
					return false;
				};
			}
		}catch(err){
			LOG.handle(err,"Could not add EventListeners to replaced URLs",urlListeners);
		}
	}

	function isPicture(FileName){
		var result = false;
		try{
			var fileTypeVector = FileName.split(".");
			var lastIndex = fileTypeVector.length -1;
			if(lastIndex !== 0){
				var extension = fileTypeVector[lastIndex].toLowerCase();
				if(extension === "jpg" || extension === "jpeg" ||extension === "png" || extension === "gif"){
					result = true;
				}
			}
		}
		catch(err){
			LOG.handle(err,"Error of Chatter.isPicture",FileName);
		}
		return result;
	}

	this.ToggleEditBox = function(element) {
		try{
			var activeId = $(element).attr("id");
			activeId = activeId.replace("_editBox_textarea","");
			var edit_box_Id = activeId + '_editBox';
			var textarea_DOM = $("#" + edit_box_Id + "_textarea");
			var textarea_DOM_Id = textarea_DOM.attr("id");
			if(textarea_DOM_Id === undefined){
				var toggle_box = Chatters.CommentEditBox(edit_box_Id, "");
				var DOM_element = $(toggle_box);
				$("#"+edit_box_Id).append(DOM_element);
				$("#"+activeId +"_editBox").show("slow");
				$("#"+activeId).trigger( "create" );
			}
			else{
				$("#"+edit_box_Id).hide("slow");
				$("#"+edit_box_Id).html("");
			}
		}
		catch(err){
			LOG.store(err,element);
		}
	};

	//A function to refresh the comment box content after taking of picture or video...
	this.RefreshEditBox = function(elementId, pictureUri){
		try{
			//Get the text that was already typed in the textArea
			var text = $("#" + elementId).val();
			//Remove "_textarea" from the elementId to avoid _textarea_textarea naming
			var newElementId = elementId.replace("_textarea", "");
			//Create the new comment box with the link to the file.
			var commentBox = Chatters.CommentEditBox(newElementId, text, pictureUri);
			//Find out the activeId
			var activeId = newElementId.replace("_editBox", "");
			//Refresh the page
			var DOM_element = $(commentBox);
			$("#" + newElementId).html("");
			$("#" + newElementId).append(DOM_element);
			$("#" + activeId).trigger( "create" );
		}catch(err){
			LOG.store(err,{"Where":"Chatter - RefreshEditBox","elementId":elementId,"pictureUri":pictureUri});
		}
	};

	//A function to generate the commenteditbox in the chatter. element_ID and text are required parameters
	//the text param is the content that is inserted in the textarea. This is done to preserve the text typed in before taking a picture.
	this.CommentEditBox = function(element_ID, text, pictureUri){
		var Result ='';
		try{
			var textarea_Id = element_ID + '_textarea';
			var click_ID = JSON.stringify(textarea_Id);
			var pictureDiv = "";
			var cameraButton = "";
			var pictureFileUri = "";
			var isComment = (click_ID.indexOf("comment") > -1);
			if(pictureUri !== undefined){
				//There is a picture
				var pictureFileName = pictureUri.substring(pictureUri.lastIndexOf('/') + 1);
				pictureDiv = "<div>" +
								"<p class='float-left'><a href='#' onclick='window.open(\"" + pictureUri + "\", \"_blank\")'>" + pictureFileName + "</a></p>" + 
								"<p class='float-right'><a href='#' onclick='Chatters.RefreshEditBox(" + click_ID + ")'>Delete</a></p>" +
								"<div class='clear-both'></div>" +
							"</div>";
				pictureFileUri = pictureUri;
			}
			else if(isComment === false){
				//No picture
				cameraButton = "<div class='float-left' style='padding-left: 1em;'><img src='images/icons/picture40x28.png' onclick='Chatters.takePicture(" + click_ID + ")'/></div>";
			}
			Result= "<div class='post-message-section'>" +
						"<div style='padding-right:6px;'>" +
							"<textarea id='" + textarea_Id + "' placeholder='Write something...' class='feed-box'  rows='7'>" + text +
							"</textarea>" +
						"</div>" +
						pictureDiv +
						"<div>" +
							"<div class='wartsila-btn orange float-right' onclick='Chatters.ShareComment(" + click_ID + ", " +  JSON.stringify(pictureFileUri) + ")'>Send</div>" +
							cameraButton +
							"<div class='clear-both'></div>" +
						"</div>" +
					"</div>";
		}
		catch(err){
			LOG.store(err,{"Where":"Chatter - CommentEditBox","element_ID":element_ID,"text":text,"pictureUri":pictureUri});
			Result = '';
		}
		return Result;
	};

	this.ShareComment = function(element_ID, pictureUri){
		try{
			//Get the editbox DOM_element for later use, when closing the editbox.
			var editBoxId = element_ID.replace("_editBox_textarea","");
			var editBox_DOM_element = $("#" + editBoxId);
			var DOM_element= $("#"+element_ID);   
			var element_Id = DOM_element.attr("Id");
			var element_Value = DOM_element.val();
			if(!element_Value){
				return false;//No comment was written
			}
			var entries = [];
			var entry;
			var SOUP_TABLE = '';

			var actDate = new Date();
			var createdDate = DateTimeObject.FormateToStringDB(actDate,'');

			var isComment = element_Id.indexOf("comment_");
			if((isComment>=0)){
				var FeedItemId = (element_Id);
				var res = FeedItemId.split("_");
				if((res===undefined) || (res.length>1)){
					FeedItemId = res[1];
				} else {FeedItemId='';} 
				if((FeedItemId===undefined) || (FeedItemId==='') || (FeedItemId.length!=SFDC_LENGTH_ID)){
					alert("You cannot comment on items not sent to Salesforce.\nPlease first synchronize the feed with SFDC and then refresh the chatter tab!");
					return false;
				}
				SOUP_TABLE = SOUP_FEEDCOMMNETS;
				entry = jQuery.extend(true, {}, COMMENT_ITEM); //clone JSON object
				entry.CommentBody = element_Value;
				entry.FeedItemId = FeedItemId;
				entry.attributes.type = SOUP_FEEDCOMMNETS;
				entry.CreatedById = MainObject.userData.Id;
				if(pictureUri !== undefined){
					entry.pictureUri = pictureUri;
				}
			}
			else{
				entry = jQuery.extend(true, {}, FEED_ITEM); //clone JSON object
				entry.Body = element_Value;
				SOUP_TABLE = SOUP_WORK_ORDER_FEED;
				entry.InsertedById = MainObject.userData.Id;
				entry.attributes.type = SOUP_WORK_ORDER_FEED;
				if(pictureUri !== undefined){
					entry.pictureUri = pictureUri;
				}
			}
			if((element_Id !== undefined) && (element_Value !== undefined)){
				entry.SaveStatus = VALUE_SAVE_LOCAL;
				entry.isDownloaded = VALUE_NO;
				entry.ParentId = Parameters.ParentId;
				entry.Id = SmartStoreManager.GeneratorID();
				entry.CreatedDate = createdDate;
				entries.push(entry);
			}
			if(entries.length>0){
				var myParameters = {Parameters:{ "MethodRunner":METHOD_REFRESH_SERVICE_CHATTER_TAB},"RecordId":Parameters.ParentId,"ParentId":Parameters.ParentId};
				SmartStoreManager.SaveBatchTemplate(entries,SOUP_TABLE,false, myParameters);
			}
			Chatters.ToggleEditBox(editBox_DOM_element);
		}
		catch(err){
			LOG.store(err,{"Where":"Chatter - ShareComment","element_ID":element_ID,"pictureUri":pictureUri});
		}
	};

	this.takePicture =  function(Id){
		try{
			//taking picture!
			navigator.camera.getPicture(function(success){
				//Callback function on successful picture
				Chatters.RefreshEditBox(Id, success);
			},
			function(fail){
				//Canceled
				//Callback when picture failed
			},
			{
				quality: 25, 
				destinationType : navigator.camera.DestinationType.FILE_URI 
			});
		}
		catch(err){
			LOG.store(err,{"Where":"Chatter - takePicture","Id":Id});
		}
	};
}