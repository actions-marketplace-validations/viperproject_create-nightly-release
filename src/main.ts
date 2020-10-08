// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
// Copyright (c) 2011-2020 ETH Zurich.

import * as core from '@actions/core';
import * as github from '@actions/github';
import {INVISIBLE_BODY_PREAMBLE} from './constants';

async function run(): Promise<void> {
  try {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      throw new Error(`Environment variable 'GITHUB_TOKEN' is not set`);
    }

    // Get authenticated GitHub client (Ocktokit): https://github.com/actions/toolkit/tree/master/packages/github#usage
    const octokit = github.getOctokit(token);

    // Get owner and repo from context of payload that triggered the action
    const {owner: owner, repo: repo} = github.context.repo;

    // Get the inputs from the workflow file: https://github.com/actions/toolkit/tree/master/packages/core#inputsoutputs
    const tagName = core.getInput('tag_name', {required: true});

    // This removes the 'refs/tags' portion of the string, i.e. from 'refs/tags/v1.10.15' to 'v1.10.15'
    const tag = tagName.replace('refs/tags/', '');
    const releaseName = core
      .getInput('release_name', {required: true})
      .replace('refs/tags/', '');
    const body = core.getInput('body', {required: false});
    const draft = false;
    const prerelease = true;
    const commitish = github.context.sha;

    // Create a release
    // API Documentation: https://developer.github.com/v3/repos/releases/#create-a-release
    // Octokit Documentation: https://octokit.github.io/rest.js/#octokit-routes-repos-create-release
    const createReleaseResponse = await octokit.repos.createRelease({
      owner,
      repo,
      tag_name: tag,
      name: releaseName,
      body: INVISIBLE_BODY_PREAMBLE() + body,
      draft,
      prerelease,
      target_commitish: commitish
    });

    // Get the ID, html_url, and upload URL for the created Release from the response
    const {
      data: {id: releaseId, html_url: htmlUrl, upload_url: uploadUrl}
    } = createReleaseResponse;

    // Set the output variables for use by other actions: https://github.com/actions/toolkit/tree/master/packages/core#inputsoutputs
    core.setOutput('id', releaseId);
    core.setOutput('html_url', htmlUrl);
    core.setOutput('upload_url', uploadUrl);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
