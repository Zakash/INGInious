# -*- coding: utf-8 -*-
#
# This file is part of INGInious. See the LICENSE and the COPYRIGHTS files for
# more information about the licensing of this file.

""" Matrix plugin - show course overview of student grades """
import logging
import web
from collections import OrderedDict
from inginious.frontend.webapp.pages.course_admin.utils import INGIniousAdminPage
from inginious.common.tasks_constants import TaskConstants
from datetime import datetime
import pymongo


class MatrixPage(INGIniousAdminPage):
    def GET_AUTH(self, courseid):
        """ GET request """
        course = self.get_course_and_check_rights(courseid, allow_all_staff=True)[0]
        data_users = []

        """ Get all information about the users """
        users = sorted(list(
            self.user_manager.get_users_info(self.user_manager.get_course_registered_users(course, False)).items()),
                       key=lambda k: k[1][0] if k[1] is not None else "")

        users = OrderedDict([(user[0], {"username": user[0],
                                     "realname": user[1][0] if user[1] is not None else None}) for user in users])

        """ Reorder course tasks according to deadline from past to future, no deadline and passed deadline """
        order_tasks = self._get_ordered_task(course)

        """ Get all user tasks """
        for user in users:
            data_user = self._calc_user_data(course, order_tasks, users[user])
            data_users.append(data_user)

        return self.template_helper.get_custom_renderer('frontend/webapp/plugins/matrix')\
            .admin(course, data_users, order_tasks, TaskConstants.ORDERED_GRADE_COLORS_RANGE)


    def _get_ordered_task(self, course):
        """ Reorder course tasks according to deadline from past to future, no deadline and passed deadline """
        tasks = course.get_tasks()
        past_future_tasks = []
        past_tasks = []
        future_tasks = []
        always_tasks = []
        never_tasks = []
        for task in tasks:
            # todo, extract strings to constants
            if tasks[task].get_deadline() == 'No deadline':
                """ Tasks with no deadline, that will always show in tasks """
                always_tasks.append(tasks[task])
            elif tasks[task].get_deadline() == "It's too late":
                """ Tasks that will never show in tasks """
                never_tasks.append(tasks[task])
            else:
                now = datetime.now()

                if tasks[task].get_accessible_time().get_start_date() < now:
                    if tasks[task].get_accessible_time().get_end_date() < now:
                        """ Past tasks that will show in the beginning """
                        past_tasks.append(tasks[task])
                    else:
                        """ Past future tasks that will show at the end """
                        past_future_tasks.append(tasks[task])
                elif tasks[task].get_accessible_time().get_start_date() > now \
                        and tasks[task].get_accessible_time().get_end_date() > now:
                    """ Future tasks that will not show in tasks """
                    future_tasks.append(tasks[task])

        order_tasks = past_future_tasks + always_tasks + past_tasks

        return order_tasks


    def _calc_user_data(self, course, order_tasks, user_data):
        username = user_data['username']
        course_id = course.get_id()
        ordered_tasks_for_user = OrderedDict([(taskid.get_id(), {"taskid": taskid,
                                                                 "name": taskid.get_name(),
                                                                 "tried": 0,
                                                                 "status": TaskConstants.DEFAULT_STATUS,
                                                                 "grade": 0}) for taskid in order_tasks])

        # TODO: Check if we can retrieve all users data once, then reference the needed details in the loop
        user_tasks = list(self.database.user_tasks.find({"username":  username, "courseid": course_id}))
        submission_ids = [user_task['submissionid'] for user_task in user_tasks]
        user_task_last_submissions = list(self.database.submissions.find({"username":  username, "_id": {"$in": submission_ids}}))
        # get all the relevant submissions (whether it's the last ones or the ones with the highest score)

        for user_task in user_tasks:
            task_id = user_task["taskid"]

            if task_id in ordered_tasks_for_user:
                task_for_user = ordered_tasks_for_user[task_id]
                user_grade = user_task["grade"]
                task_for_user["tried"] = user_task["tried"]
                if user_task["tried"] == 0:
                    task_for_user["status"] = "notattempted"
                else:
                    task_for_user["status"] = \
                        self.task_factory.get_relevant_color_class_for_grade(user_grade)

                task_for_user["grade"] = user_task["grade"]
                task_for_user["submissionid"] = str(user_task["submissionid"])
                # take the submission id from the task (will be the last submitted ) and query the submission 'submissionid'
                last_submissions_for_task = {'a': 1}
                if last_submissions_for_task:
                    a = 1 # calc last submission from now
                    task_for_user['submission_data'] = {'url': 'http://google.com', 'time_passed': '3 days ago'}
                    # link to the all submissions page, example http://localhost:8080/admin/tutorial/student/ohad/03_tasks

        data_user = {'name': user_data, 'tasks': ordered_tasks_for_user}
        return data_user


def add_admin_menu(course):
    """ Add matrix setting to the admin panel """
    return ('matrix', '<i class="fa fa-graduation-cap fa-fw"></i>&nbsp; Matrix')


def add_css_file():
    """ Add matrix css file to the admin page """
    return web.ctx.homepath + '/static/webapp/plugins/matrix/matrix.css'


def init(plugin_manager, _, _2, _3):
    """ Init the matrix plugin """
    plugin_manager.add_hook('course_admin_menu', add_admin_menu)
    plugin_manager.add_hook('css', add_css_file)
    plugin_manager.add_page("/admin/([^/]+)/matrix", MatrixPage)

