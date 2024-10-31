import * as d3 from 'd3';
export const loadAndPreprocessData = () => {
  const porDataPromise = d3.csv('/student-por.csv').then(data => 
    data.map(d => ({
      sex: d.sex,
      school: d.school,
      age: +d.age,
      G3: +d.G3,
      Medu: +d.Medu,
      Fedu: +d.Fedu,  
      Dalc: +d.Dalc,  
      Walc: +d.Walc   // Weekend alcohol consumption
    }))
  );

  const matDataPromise = d3.csv('/student-mat.csv').then(data => 
    data.map(d => ({
      sex: d.sex,
      school: d.school,
      age: +d.age,
      G3: +d.G3,
      Medu: +d.Medu,
      Fedu: +d.Fedu,
      Dalc: +d.Dalc,
      Walc: +d.Walc
    }))
  );

  return Promise.all([porDataPromise, matDataPromise]).then(([porData, matData]) => {
    const combinedData = [...porData, ...matData];

    const lowGradesThreshold = 10;  // Define threshold for low/high grades
    const ageThreshold = 18;        // Define threshold for young/old
    const groupedData = {
      nodes: [
        { name: 'Low Medu', color: 'steelblue' },
        { name: 'High Medu', color: 'orange' },
        { name: 'Low Fedu', color: 'lightblue' },
        { name: 'High Fedu', color: 'red' },
        { name: 'Low Dalc', color: 'green' },
        { name: 'High Dalc', color: 'purple' },
        { name: 'Low Walc', color: 'pink' },
        { name: 'High Walc', color: 'brown' },
        { name: 'Young', color: 'yellow' },
        { name: 'Old', color: 'gray' },
        { name: 'GP', color: 'cyan' },
        { name: 'MS', color: 'magenta' },
        { name: 'Male', color: 'blue' },
        { name: 'Female', color: 'pink' },
        { name: 'Low Grades', color: 'green' },
        { name: 'High Grades', color: 'red' }
      ],
      links: []
    };

    // Initialize counters
    let lowMeduLowGrades = 0, lowMeduHighGrades = 0;
    let highMeduLowGrades = 0, highMeduHighGrades = 0;
    let lowFeduLowGrades = 0, highFeduHighGrades = 0;
    let lowDalcLowGrades = 0, highDalcHighGrades = 0;
    let lowWalcLowGrades = 0, highWalcHighGrades = 0;
    let youngLowGrades = 0, oldLowGrades = 0;
    let gpLowGrades = 0, msLowGrades = 0;
    let maleLowGrades = 0, femaleLowGrades = 0;

    combinedData.forEach(student => {
      // Mother's education (Medu)
      if (student.Medu <= 2) {
        if (student.G3 <= lowGradesThreshold) lowMeduLowGrades++;
        else lowMeduHighGrades++;
      } else {
        if (student.G3 <= lowGradesThreshold) highMeduLowGrades++;
        else highMeduHighGrades++;
      }

      // Father's education (Fedu)
      if (student.Fedu <= 2) {
        if (student.G3 <= lowGradesThreshold) lowFeduLowGrades++;
        else highFeduHighGrades++;
      }

      // Workday alcohol consumption (Dalc)
      if (student.Dalc <= 2) {
        if (student.G3 <= lowGradesThreshold) lowDalcLowGrades++;
        else highDalcHighGrades++;
      }

      // Weekend alcohol consumption (Walc)
      if (student.Walc <= 2) {
        if (student.G3 <= lowGradesThreshold) lowWalcLowGrades++;
        else highWalcHighGrades++;
      }

      // Age (Young vs. Old)
      if (student.age <= ageThreshold) {
        if (student.G3 <= lowGradesThreshold) youngLowGrades++;
        else oldLowGrades++;
      }

      // School (GP vs. MS)
      if (student.school === 'GP') {
        if (student.G3 <= lowGradesThreshold) gpLowGrades++;
        else msLowGrades++;
      }

      // Gender (Male vs. Female)
      if (student.sex === 'M') {
        if (student.G3 <= lowGradesThreshold) maleLowGrades++;
        else femaleLowGrades++;
      }
    });

    // Define links for multiple factors
    groupedData.links = [
      { source: 0, target: 14, value: lowMeduLowGrades },  // Low Medu -> Low Grades
      { source: 0, target: 15, value: lowMeduHighGrades },  // Low Medu -> High Grades
      { source: 1, target: 14, value: highMeduLowGrades },  // High Medu -> Low Grades
      { source: 1, target: 15, value: highMeduHighGrades }, // High Medu -> High Grades
      { source: 2, target: 14, value: lowFeduLowGrades },   // Low Fedu -> Low Grades
      { source: 3, target: 15, value: highFeduHighGrades }, // High Fedu -> High Grades
      { source: 4, target: 14, value: lowDalcLowGrades },   // Low Dalc -> Low Grades
      { source: 5, target: 15, value: highDalcHighGrades }, // High Dalc -> High Grades
      { source: 6, target: 14, value: lowWalcLowGrades },   // Low Walc -> Low Grades
      { source: 7, target: 15, value: highWalcHighGrades }, // High Walc -> High Grades
      { source: 8, target: 14, value: youngLowGrades },     // Young -> Low Grades
      { source: 9, target: 15, value: oldLowGrades },       // Old -> High Grades
      { source: 10, target: 14, value: gpLowGrades },       // GP -> Low Grades
      { source: 11, target: 15, value: msLowGrades },       // MS -> High Grades
      { source: 12, target: 14, value: maleLowGrades },     // Male -> Low Grades
      { source: 13, target: 15, value: femaleLowGrades }    // Female -> High Grades
    ];

    return { combinedData, groupedData };
  });
};