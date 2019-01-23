const request = require("request-promise"); //  'request' npm package with Promise support
const getQuestions = async allQuestionIds => {
  const questions = allQuestionIds.map(async questionId => {
    const options = {
      method: "GET",
      url: `https://dev.sunbirded.org/action/assessment/v3/items/read/${questionId}`,
      json: true
    };
    const response = await request(options);
    return response.result.assessment_item;
  });
  return await Promise.all(questions);
};
app.use("/get/:id", async (req, res) => {
  const options = {
    method: "GET",
    url: `https://dev.sunbirded.org/api/content/v1/read/${
      req.params.id
    }?fields=questions`,
    json: true
  };
  let allQuestions;
  try {
    allQuestions = await request(options);
    const allQuestionIds = [];
    allQuestions.result.content.questions.forEach(question => {
      allQuestionIds.push(question.identifier);
    });
    questionMeta = await getQuestions(allQuestionIds);
    res.json(questionMeta);
  } catch (error) {
    console.log(error);
    if (error.error) {
      res.status(404).json(error.error);
    } else {
      res.status(404).json("unhandled erro");
    }
  }
});
