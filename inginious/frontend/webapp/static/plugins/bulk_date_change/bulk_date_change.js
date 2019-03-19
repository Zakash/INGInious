/**
 * ManualPlugin
 *
 * @type {{onClickSave, onSubmitAllBtn, onCloseWindow, getDefaultFeedbacksValue, onClickArrowBtn, onChangeOverallGrade, initManualTask}}
 */
var BulkDateChangePlugin = (function() {
    var isSaved = false;
    var $ = jQuery;
    var alertID = 'alert-manual-feedback';
    var secondsDelayToDissolveAlert = 3;
    /**
     * On save btn
     * @param courseId
     * @param lessonId
     */
    function onClickSave(courseId, lessonId) {
        var saveBtn =  $('.submit-btn');
        var selected_lesson = $('#list').change(function() {
            return $(":selected").attr('value');
        });
        var accessible_start = $('#accessible_start').change(function() {
            return $(":selected").attr('value');
        });
        var accessible_end = $('#accessible_end').change(function() {
            return $(":selected").attr('value');
        });

        saveBtn.on('click', function () {
            _sendTasks (courseId, selected_lesson, accessible_start, accessible_end)
        });


    }


    /**
     * Change date for all lesson
     * @param courseId
     * @param selected_lessson
     * @param accessible_start
     * @param accessible_end

     */
    var _sendTasks = function(courseId, selected_lesson, accessible_start, accessible_end) {
        var url = '/admin/' + courseId + '/bulk_date_change';

        var data = {};

        data['selected_lesson'] = selected_lesson.val();
        data['accessible_start'] = accessible_start.val();
        data['accessible_end'] = accessible_end.val();
        console.log(data['selected_lesson']);
        $.ajax({
            url: url,
            method: "POST",
            data: JSON.stringify(data),
            dataType: 'json',
            success: function(data) {
                if (data.status == 'success') {
                    _manualAlertMessage("Deadline changed", 'success');
                } else {
                    _manualAlertMessage("Your feedback failed!", 'danger');
                }
            },
            error: function(data) {
                _manualAlertMessage('An internal error occurred. Please retry later. If the error persists, send an email to the course administrator.', 'danger')
            }
        });
    };

    var _manualAlertMessage = function(message, type) {
        var manualTitle = $('.manual-title');
        var alertIDForDiv='#'+alertID;
        var alert = $('<div id="'+alertID+'"></div>');
        var closeBtn = $("<button></button>");

        closeBtn.addClass("close");
        closeBtn.attr("type", "button").attr("data-dismiss", "alert").attr("aria-hidden", "true").attr("aria-label", "Close");
        closeBtn.html("&times;");

        alert.addClass('alert' + ' alert-' + type);
        alert.attr('role', 'alert');

        alert.append(closeBtn);
        alert.append(message);

        if (!$('.alert').length) {
            manualTitle.after(alert);
        }

        $(alertIDForDiv).fadeTo(secondsDelayToDissolveAlert*1000, 500).slideUp(500, function(){
            $(alertIDForDiv).slideUp(500);
        });
    };


    /**
     * On submit all btn
     */
    var onSubmitAllBtn = function() {
        var submitAllBtn = $('.submit-all');
        var tasks = $('form')
        submitAllBtn.on('click', function(event) {
            event.preventDefault();
            $.each(tasks, function(index, value){
               var taskChildren = $(value).children()
                if(taskChildren.length > 2){
                    $(value).submit();
                }
            })
        });
    };



    /**
     * Get alert code
     * @param content
     * @param type
     * @returns {*|jQuery|HTMLElement}
     */
    function manualGetAlertCode(content, type) {
        var taskAlert = $('<div></div>');
        taskAlert.attr('id', 'task_alert');

        var alert = $('<div></div>');
        alert.addClass('alert fade in alert-' + type);
        alert.attr('role', 'alert');
        alert.appendTo(taskAlert);

        content.appendTo(alert);

        return taskAlert;
    }


    /**
     * Get loading alert
     * @param task
     */
    function manualGetLoadingAlert(task) {
        var form = task.find('form');
        var content = '<i class="fa fa-spinner fa-pulse fa-fw" aria-hidden="true"></i>';
        content += "<b>Your submission has been sent...</b>";

        var loadingAlert = $('<div></div>');
        loadingAlert.addClass('loading-alert');
        loadingAlert.html(content);

        var taskAlert = manualGetAlertCode(loadingAlert, 'info');

        task.find('#task_alert').html(taskAlert);
    }


    /**
     * Display failed alert
     * @param task
     * @param taskData
     */
    // function manualDisplayFailedAlert(task, taskData) {
    //     var div = $('<div></div>');
    //
    //     var b = $('<b></b>');
    //     b.html('There are some errors in your answer. Your score is ' + taskData.grade + '<br>');
    //     b.appendTo(div);
    //
    //     var pre = $(taskData.text);
    //     pre.appendTo(div);
    //
    //     var taskAlert = manualGetAlertCode(div, 'danger');
    //
    //     task.find('#task_alert').html(taskAlert);
    // }


    /**
     * Display success alert
     * @param task
     * @param taskData
     */
    // function manualDisplaySuccessAlert(task, taskData) {
    //     var div = $('<div></div>');
    //     var content = '';
    //     content += 'Your answer passed the tests! Your score is ' + taskData.grade;
    //     content += taskData.text;
    //     div.html(content);
    //
    //     var taskAlert = manualGetAlertCode(div, 'success');
    //
    //     task.find('#task_alert').html(taskAlert);
    // }


    /**
     * Display kill alert
     * @param task
     */
    // function manualDisplayKillAlert(task) {
    //     var b = $('<b></b>');
    //     b.html('Your submission was killed.');
    //
    //     var taskAlert = manualGetAlertCode(b, 'warning');
    //
    //     task.find('#task_alert').html(taskAlert);
    // }


    /**
     * Display error alert
     * @param task
     */
    function manualDisplayErrorAlert(task) {
        var b = $('<b></b>');
        b.html('An internal error occured. Please retry later. If the error persists, send an email to the course administrator.');

        var taskAlert = manualGetAlertCode(b, 'danger');

        task.find('#task_alert').html(taskAlert);
    }


    /**
     * Display timeout alert
     * @param task
     * @param taskData
     */
    // function manualDisplayTimeoutAlert(task) {
    //     var b = $('<b></b>');
    //     b.html('Your submission timed out');
    //
    //     var taskAlert = manualGetAlertCode(b, 'warning');
    //
    //     task.find('#task_alert').html(taskAlert);
    // }


    /**
     * Display overflow alert
     * @param task
     * @param taskData
     */
    // function manualDisplayOverflowAlert(task) {
    //     var b = $('<b></b>');
    //     b.html('Your submission made an overflow');
    //
    //     var taskAlert = manualGetAlertCode(b, 'warning');
    //
    //     task.find('#task_alert').html(taskAlert);
    // }


    /**
     * On click to top btn
     */
    var _onToTopBtn = function() {
        var body = $('html, body');
        var toTopBtn = $('.to-top');

        toTopBtn.on('click', function(event) {
            event.preventDefault();
            body.stop().animate({ scrollTop: 0 }, '500', 'swing');
        });
    };


    /**
     * On click to feedback btn
     * @param task
     */
    var _onToFeedback = function(task) {
        var body = $('html, body');
        var toFeedbackBtn = task.find('.to-feedback');

        toFeedbackBtn.on('click', function() {
            event.preventDefault();
            $(body).stop().animate({ scrollTop: task.offset().top }, '500', 'swing');
            task.find('.feedback').focus();
        });
    };


    /**
     * Check changes on grade
     * @param task
     * @param taskId
     */
    var _onChangeGrade = function(task, taskId) {
        var gradeInput = task.find('.grade');
        var grade = $('.grade-' + taskId);
        var newGrade = '';

        gradeInput.on('keyup change click', function () {
            if (_isGradeValid(gradeInput.val())) {
                grade.html(gradeInput.val());
                _checkAvgGrade();
            } else {
                if (gradeInput.val().toString().substring(0, 3) == 100) {
                    newGrade = gradeInput.val().toString().substring(0, 3);
                } else {
                    newGrade = gradeInput.val().toString().substring(0, 2);
                }

                gradeInput.val(newGrade);
            }
        });
    };


    /**
     * Check if the grade is valid or not
     * @param grade
     * @returns {boolean}
     */
    var _isGradeValid = function(grade) {
        return grade >= 0 && grade <= 100;
    };


    /**
     * Check the avg grade and update the table
     */
    var _checkAvgGrade = function() {
        var avgGradeDiv = $('.avg-grade');
        var gradesLength = $('.overall-grade').find('td').length;
        var grades = [];
        var grade;
        var avgGrade = 0;

        for (var i = 0; i < gradesLength - 2 ; i++) {
            grade = $($('.overall-grade').find('td')[i + 2]);

            if (grade.html().trim() != '') {
                grades.push(grade.html().trim());
            }
        }

        for (var j = 0; j < grades.length; j++) {
            avgGrade += parseInt(grades[j]);
        }

        avgGrade = Math.round(avgGrade / grades.length);

        avgGradeDiv.html(avgGrade);
    };


    return {
        onClickSave: onClickSave,
        onSubmitAllBtn: onSubmitAllBtn,
        onClickExport: onClickExport,
        onClickExportAndNext: onClickExportAndNext,
        onCloseWindow: onCloseWindow,
        getDefaultFeedbacksValue: getDefaultFeedbacksValue,
        onClickArrowBtn: onClickArrowBtn,
        onChangeOverallGrade: onChangeOverallGrade,
        initManualTask: initManualTask
    }
})(jQuery);

