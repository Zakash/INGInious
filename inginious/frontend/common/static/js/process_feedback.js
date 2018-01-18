// font awesome icons for terminal feedback (in modal popup)
var COMMENTS_IMAGES = {
    output: "fa-desktop",
    input: "fa-keyboard-o",
    false_: "fa-times-circle-o",
};


function fillModalTerminalBoxes(feedbackData, scenarioId) {
    var scenarioIdStr = '-' + scenarioId;
    var comments = [];
    console.log('scenarioIdStr is ' + scenarioIdStr);

    if (feedbackData.args) {
        // The modal's Terminal initialization
        var command_line = "C:\\Magshimim> program.exe";
        for (var i = 0; i < feedbackData.args.length; i++) {
            command_line += " " + feedbackData.args[i];
        }
    }
    $("#scenario_log" + scenarioIdStr).append('<li>' + command_line + '<li>');
    if (feedbackData.log) {
        for (var i = 0; i < feedbackData.log.quotes.length; i++) {
            var line = $('<li></li>');
            line.text(feedbackData.log.quotes[i].value);
            // todo, return this if
            if (feedbackData.log.quotes[i].type.en == "input" || feedbackData.log.quotes[i].type.en == "output") {
                line.addClass("commentable-section");
                line.attr("data-section-id", i.toString());

                comments.push({
                    "sectionId": i.toString(),
                    "comments": [
                        {
                            "id": i.toString(),
                            "authorAvatarUrl": COMMENTS_IMAGES[feedbackData.log.quotes[i].type.en],
                            "authorName": feedbackData.log.quotes[i].type.he,
                            "comment": feedbackData.log.quotes[i].name
                        }
                    ]
                });
            }
            $("#scenario_log" + scenarioIdStr).append(line);
        }
    }


    var currentUser = {
        "id": 4,
        "avatarUrl": "support/images/user.png",
        "authorUrl": "http://google.com/",
        "name": "You"
    };


    var SideComments = require('side-comments');
    window.sideComments = new SideComments('#commentable-container' + scenarioIdStr, currentUser, comments);
}

function generateSentSignature(data){
    var methodName = data.method_name || 'solution';
    var argumentsSent = data.arguments_sent;
    var argsString = convertArgs(argumentsSent);
    return methodName + '(' +  String(argsString) + ')';
}

function renderScenarioRows(feedbackData, taskId) {
    var scenario_row,
        modal;
    console.log('here is feedbackData. ');
    console.log(feedbackData);
    feedbackData[0]['expected'] = convertToString(feedbackData[0]['expected'])

    $.each(feedbackData, function (id, data) {
        {
            console.log('here is feedbackData. data is -- ');
            data.id = id;
            data.indexId = parseInt(id) + 1;
            if (isSuccess(data)) {
                {
                    data.color = 'green'
                }
            } else {
                {
                    data.color = 'red'
                }
            }


            //add the hidden modal
            modal = $(tmpl('tmpl-modal', data));
            $('#modals-' + taskId).append(modal);

            // in python's case, this data wil be presented in the feedback table like so
            // my_function(1,"foo", "bar")

            data.sentToFunction = generateSentSignature(data);
            // add row to scenario table
            scenario_row = $(tmpl('tmpl-scenario-row', data));
            $('#scenarios-table-' + taskId).append(scenario_row);

        }
    });

    // relevant to python's feedback only, will do nothing in other courses
    if (feedbackData[0] && feedbackData[0].method_signature) {
        $('#scenarios-table-' + taskId + ' #method-signature').html(feedbackData[0].method_signature)
    }

}


// whether a scenario is success or failure
function isSuccess(data) {{
    return data.result.bool
}}

function convertArgs(args) {

    var stringArgs = [];

    $.each(args, function (index, data) {

        stringArgs[index] = convertToString(data)
    })

    return stringArgs;
}

function convertToString(data) {

     var type = typeof (data);

     switch (type) {
         case "object":
             return "[" + data.join() + "]";
             break;
         case "number":
             return data;
             break;
         case "string":
             return '"' + data + '"';
             break;
         default:
             return data;
     }
}