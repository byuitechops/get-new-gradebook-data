var canvas = require('canvas-api-wrapper');
var pmap = require('p-map'); 

async function main (courses) {
    var i = 0;
    async function getStuff (course) {
        console.log(`${++i}/${courses.length}`)
        course = await addUsingNewGradebookData(course);
        course = await addTeacherData(course);
        return course;
    }
    courses = courses.slice(0,100)
    courses = await pmap(courses, getStuff, {concurrency: 50});


    console.log(courses[0])
    sortedCourses = sortCoursesByNewGradebook(courses)
    var teachers = {
        newGradebookEnabled: sortByTeacher(sortedCourses.yesNewGradebook),
        newGradebookDisabled: sortByTeacher(sortedCourses.noNewGradebook)
    }
    return teachers;
}

async function addUsingNewGradebookData (course) {
    var newGradebookValue = 'new_gradebook';
    var enabledFeatures = await canvas.get(`/api/v1/courses/${course.id}/features/enabled`);
    course.new_gradebook_enabled = enabledFeatures.some(feature => feature === newGradebookValue);
    return course;
}

async function addTeacherData (course) {
    async function teacherystuff (teacher) {
        var teacherData = await canvas.get(`https://byui.instructure.com/api/v1/users/${teacher.id}`);
        var teacherOut = {
            teacher_id: teacherData.id,
            teacher_name: teacherData.name,
            teacher_email: teacherData.email,
        };
        return teacherOut;
    }

    teacherData = [];
    for (let teacher of course.teachers) {
        teacherData.push(await teacherystuff(teacher));
    }
    course.teachers = teacherData;
    return course;
}



function sortCoursesByNewGradebook (coursesIn) {
    var courses = {
        yesNewGradebook : [],
        noNewGradebook : []
    }
    return coursesIn.reduce ((acc, course) => {
        if (course.new_gradebook_enabled)
            acc.yesNewGradebook.push(course)
        else
            acc.noNewGradebook.push(course)
        return acc;
    }, courses)
}

function sortByTeacher (courses) {

    var newTeachers = courses.reduce((acc, course) => {
        course.teachers.forEach(teacher => {
            if (typeof acc[teacher.teacher_id] === 'undefined') {
                acc[teacher.teacher_id] = {
                    teacher_id: teacher.teacher_id,
                    teacher_name: teacher.teacher_name,
                    teacher_email: teacher.teacher_email,
                    course_ids: [],
                    course_names: [],
                    course_codes: [],
                    course_sisids: [],
                }
            }
            acc[teacher.teacher_id].course_ids.push(course.id);
            acc[teacher.teacher_id].course_names.push(course.name);
            acc[teacher.teacher_id].course_codes.push(course.course_code);
            acc[teacher.teacher_id].course_sisids.push(course.sis_course_id);
        });
        return acc;
    }, {})
    function CustomToString (input) {
        if (!Array.isArray(input)){
            debugger;
            return input;
        }
        else
            return input.join(", ")
    }
    return Object.keys(newTeachers).map(key => {
        teacherOut = newTeachers[key];
        
    teacherOut.course_ids = CustomToString(teacherOut.course_ids)
        
    teacherOut.course_names = CustomToString(teacherOut.course_names)
        
    teacherOut.course_course = CustomToString(teacherOut.course_course)
        
    teacherOut.course_sisids = CustomToString(teacherOut.course_sisids)
        return teacherOut;
    });
    

    
}

module.exports = main;