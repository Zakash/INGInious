# -*- coding: utf-8 -*-
#
# This file is part of INGInious. See the LICENSE and the COPYRIGHTS files for
# more information about the licensing of this file.

""" Some utils for all the pages """
from typing import List

import web
from gridfs import GridFS
from pymongo.database import Database

from inginious.common.course_factory import CourseFactory
from inginious.common.task_factory import TaskFactory
from inginious.frontend.common.plugin_manager import PluginManager
from inginious.frontend.common.submission_manager import SubmissionManager
from inginious.frontend.common.template_helper import TemplateHelper
from inginious.frontend.webapp.user_manager import UserManager


class INGIniousPage(object):
    """
    A base for all the pages of the INGInious webapp.
    Contains references to the PluginManager, the CourseFactory, and the SubmissionManager
    """

    @property
    def app(self):
        """ Returns the web application singleton """
        return web.ctx.app_stack[0]

    @property
    def plugin_manager(self) -> PluginManager:
        """ Returns the plugin manager singleton """
        return self.app.plugin_manager

    @property
    def course_factory(self) -> CourseFactory:
        """ Returns the course factory singleton """
        return self.app.course_factory

    @property
    def task_factory(self) -> TaskFactory:
        """ Returns the task factory singleton """
        return self.app.task_factory

    @property
    def submission_manager(self) -> SubmissionManager:
        """ Returns the submission manager singleton"""
        return self.app.submission_manager

    @property
    def user_manager(self) -> UserManager:
        """ Returns the user manager singleton """
        return self.app.user_manager

    @property
    def template_helper(self) -> TemplateHelper:
        """ Returns the Template Helper singleton """
        return self.app.template_helper

    @property
    def database(self) -> Database:
        """ Returns the database singleton """
        return self.app.database

    @property
    def gridfs(self) -> GridFS:
        """ Returns the GridFS singleton """
        return self.app.gridfs

    @property
    def default_allowed_file_extensions(self) -> List[str]:  # pylint: disable=invalid-sequence-index
        """ List of allowed file extensions """
        return self.app.default_allowed_file_extensions

    @property
    def default_max_file_size(self) -> int:
        """ Default maximum file size for upload """
        return self.app.default_max_file_size

    @property
    def backup_dir(self) -> str:
        """ Backup directory """
        return self.app.backup_dir

    @property
    def containers(self) -> List[str]:  # pylint: disable=invalid-sequence-index
        """ Available containers """
        return self.app.submission_manager.get_available_environments()

    @property
    def webterm_link(self) -> str:
        """ Returns the link to the web terminal """
        return self.app.webterm_link


class INGIniousAuthPage(INGIniousPage):
    """
    Augmented version of INGIniousPage that checks if user is authenticated.
    """

    def POST_AUTH(self, *args, **kwargs):  # pylint: disable=unused-argument
        raise web.notacceptable()

    def GET_AUTH(self, *args, **kwargs):  # pylint: disable=unused-argument
        raise web.notacceptable()

    def GET(self, *args, **kwargs):
        """
        Checks if user is authenticated and calls GET_AUTH or performs logout.
        Otherwise, returns the login template.
        """
        if self.user_manager.session_logged_in():
            user_input = web.input()
            if "logoff" in user_input:
                self.user_manager.disconnect_user(web.ctx['ip'])
                return self.template_helper.get_renderer().index(self.user_manager.get_auth_methods_fields(), False)
            else:
                return self.GET_AUTH(*args, **kwargs)
        else:
            return self.template_helper.get_renderer().index(self.user_manager.get_auth_methods_fields(), False)

    def POST(self, *args, **kwargs):
        """
        Checks if user is authenticated and calls POST_AUTH or performs login and calls GET_AUTH.
        Otherwise, returns the login template.
        """
        if self.user_manager.session_logged_in():
            return self.POST_AUTH(*args, **kwargs)
        else:
            user_input = web.input()
            if "@authid" in user_input:
                if self.user_manager.auth_user(int(user_input["@authid"]), user_input, web.ctx['ip']):
                    return self.GET_AUTH(*args, **kwargs)
                else:
                    return self.template_helper.get_renderer().index(self.user_manager.get_auth_methods_fields(), True)
            else:
                return self.template_helper.get_renderer().index(self.user_manager.get_auth_methods_fields(), False)
