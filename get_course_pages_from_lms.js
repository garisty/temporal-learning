'use strict';
/*
 Script to generate course landing pages from TalentLMS API.
 For each course in the API, generates a course landing page
 with the link to the LMS.

 API token required. Set `LMS_API_TOKEN`


*/

const https = require('https');
const LMS_API_TOKEN = process.env.LMS_API_TOKEN;

const courseData = [
  {code: '101_go', language: "Go", banner: "![Temporal Go SDK](/img/sdk_banners/banner_go.png)"},
  {code: '102_go', language: "Go", banner: "![Temporal Go SDK](/img/sdk_banners/banner_go.png)"},
  {code: '101_typescript', language: "TypeScript", banner: "![Temporal TypeScript SDK](/img/sdk_banners/banner_typescript.png)"},
  {code: '101_java', language: "Java", banner: "![Temporal Java SDK](/img/sdk_banners/banner_java.png)"},
]

const options = {
  hostname: 'temporal.talentlms.com',
  auth: `${LMS_API_TOKEN}:`,
  path: '/api/v1/courses',
  port: 443,
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
};

const req = https.request(options, res => {
  // console.log(`statusCode: ${res.statusCode}`);

  res.on('data', (data) => {
    const url = 'https://temporal.talentlms.com/catalog';
    const fs = require('fs');

    //console.log(data)
    let courses = JSON.parse(data);
    //console.log(courses)

    // only get the courses we care about.
    let allowlist = courseData.map(c => c.code)
    courses = courses.filter(course => allowlist.includes(course.code) );

    let index = 1;
    for (let course of courses) {

      let metadata = courseData.find(c => c.code === course.code);

      let md = generateMarkdown(course, metadata, url, index)

      let f = course.code.match(/(.*)_(.*)/)
      let filename = `temporal_${f[1]}/${f[2]}.md`;

      console.log(filename)

      fs.writeFileSync(`docs/courses/${filename}`, md);
      index++;
    }
  });
});

req.on('error', error => {
  console.error(error);
});

req.end();


/* generate the markdown for the course.
 *
 * Takes the course data, the base url, and an index which specifies
 * the sidebar position.
 */
function generateMarkdown(course, metadata, base_url, index) {
  console.log(metadata)
  let today = (new Date()).toString().split(' ').splice(1,3).join(' ');

  let active = course.status === "active";
  let publicCourse = course.shared === 1;
  let url = `${base_url}/info/id:${course.id}`;
  let apidate = course.last_update_on;
  let dateparts = apidate.split(",")[0];
  let [dd,mm,yy] = dateparts.split("/");
  let date = `${yy}-${mm}-${dd}`

  let str = `---
title: ${course.name}
sidebar_position: ${index}
sidebar_label: ${course.name}
public: ${publicCourse}
draft: ${!active}
tags: [courses, ${metadata.language}]
custom_edit_url: null
hide_table_of_contents: true
last_update:
  date: ${date}
image: /img/temporal-logo-twitter-card.png
---

<!-- Generated ${today} -->
<!-- DO NOT edit this file directly. -->

${metadata.banner}

`
if (!active) {
  str += `:::info Course coming soon!
We're still building this course. The course outcomes and content are subject to change.

<a className="button button--primary" href="https://pages.temporal.io/get-updates-education">Get notified when we launch this course!</a>

:::

`
}

str += course.description + '\n\n';

if (active) {
  str += ` <a className="button button--primary" href="${url}">Go to Course</a> `;
}else{
  str += "This course is coming soon.\n\n"
  str += ` <a className="button button--primary" href="https://pages.temporal.io/get-updates-education">Get notified when we launch this course!</a> `;
}

  return str;
}
