

var MessagesPage = new MessagePage();

function MessagePage(){

	ProgressValue : 0;

	this.messageTemplate = function(div_Name, status, displayText, Parameters, ShowFooter){
		var result = "KO";
		try{
			$("#"+div_Name).html("");
			var css_div ="'progress-bar progress-bar-success progress-bar-striped'";
			var footerDOM ;
			var FooterID ='';
			switch(div_Name){
				case DIV_INDEX_PAGE_STATUS:
					FooterID = DIV_INDEX_FOOTER;
					break;
				case DIV_SERVICE_ORDER_PAGE_STATUS:
					FooterID = DIV_SERVICE_ORDER_FOOTER;
					break;
				default:
					break;
			}
			if(FooterID){
				footerDOM = document.getElementById(FooterID);
				if((footerDOM !== undefined && footerDOM !== null) ){
					if(ShowFooter === false){
						footerDOM.style.display = "none";
					}  
					else{
						footerDOM.style.display = "inline"; //default value
					}
				}
			}
			var imgURL="'images/msg/confirm32.png'";		 
			switch(status){
				case MSG_OK:
					imgURL = "'images/msg/confirm32.png'";
					break;
				case MSG_INFO:
					imgURL = "'images/msg/info32.png'";
					css_div = "'progress-bar progress-bar-info progress-bar-striped'";	
					break;
				case MSG_WARNING:
					imgURL = "'images/msg/warning32.png'";
					css_div = "'progress-bar progress-bar-warning progress-bar-striped'";
					break;
				case MSG_ERROR:
					imgURL = "'images/msg/error32.png'";
					css_div = "'progress-bar progress-bar-danger progress-bar-striped'";
					break;
				default:
					break;
			}
			var newRow;
			var div_bar;
			if((Parameters !== undefined) && (Parameters.Display === true)){			 
				var percent = Parameters.ProgressValue;
				newRow = $("<div class='progress'></div>");
				div_bar = $("<div class=" + css_div + " role='progressbar' aria-valuenow='" + percent + "' " +
				" aria-valuemin='0' aria-valuemax='100' style='width:" + percent + "%'>" +
				displayText +
				"</div>"
				);
				newRow.append(div_bar);
			}
			else{
				newRow = $("<span class='header'>" + displayText + "</span>");
			}
			$("#" + div_Name).append(newRow);
			$("#" + div_Name).trigger("create");  
			$("#" + div_Name + "_proc_icon").html("");             
			var imgRow = $(" <img src=" + imgURL + "></img>");
			$("#" + div_Name + "_proc_icon").append(imgRow);
			$("#" + div_Name + "_proc_icon").trigger("create");   
			result = "OK";
		}
		catch(err){
			storeExternalError(err,{"Where":"MessagesPage - messageTemplate","div_Name":div_Name,"status":status,"displayText":displayText,"Parameters":Parameters,"ShowFooter":ShowFooter});
			result = "KO";
		}
		return result; 
	};
}