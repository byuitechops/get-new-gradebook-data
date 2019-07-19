var fs = require('fs');

var main = require('../main');
var d3 = require('d3-dsv');
var canvas = require('canvas-api-wrapper');

async function getInput (subaccount = 48, enrollmentTermId = 23) {
    var courses = await canvas.get(`/api/v1/accounts/${subaccount}/courses?include[]=teachers&enrollment_term_id=${enrollmentTermId}`);
    return courses;
}

async function getInputFromCourseId (courseIds) {
    return await Promise.all (
        courseIds.map(async id => {
            return await canvas.get(`/api/v1/courses/${id}?include[]=teachers`);
        })
    )
}

function generateOutputCourseCentered (data) {
    // Reduction Values
    keeperKeys = [
        "name",
        "course_code",
        "id",
        "sis_course_id",
        "teachers",
        "new_gradebook_enabled"
    ];
    data = data.map(course => {
        return Object.keys(course).reduce( (acc, courseKey) => {
            acc[courseKey] = course[courseKey];
            if (typeof course[courseKey] === 'object')
                acc[courseKey] = JSON.stringify(course[courseKey], null, 4);
            return acc;
        }, {} );
    })
    var csv = d3.csvFormat(data, keeperKeys);
    fs.writeFileSync('./NewGradeBookData.csv', csv)
}

function generateOutputTeacherCentered (data) {
    keeperKeys = [
        "teacher_id",
        "teacher_name",
        "teacher_email",
        "course_ids",
        "course_names",
        "course_codes",
        "course_sisids",
    ];

    var csvNewGradebookEnabled = d3.csvFormat(data.newGradebookEnabled, keeperKeys);
    var csvNewGradebookDisabled = d3.csvFormat(data.newGradebookDisabled, keeperKeys);
    fs.writeFileSync('./NewGradeBookData_Enabled.csv', csvNewGradebookEnabled)
    fs.writeFileSync('./NewGradeBookData_Disabled.csv', csvNewGradebookDisabled)
    

}

async function run () {
    var subAccount = process.argv[2];
    var enrollmentTermId = process.argv[3];
    console.log('Getting Input')
    var input = await getInput(subAccount, enrollmentTermId);
    // var input = await getInputFromCourseId([80, 16762]);
    console.log('Running Main');
    var data = await main(input);
    console.log('Producing Output');
    // generateOutput(data);
    generateOutputTeacherCentered(data);
    console.log('The Process has finished. You may now exit.')
}

run();