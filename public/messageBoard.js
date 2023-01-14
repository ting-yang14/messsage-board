messageBoardInit();

async function messageBoardInit() {
  const getRecordsRes = await fetch(`/records`);
  const response = await getRecordsRes.json();
  const records = await response.data;
  records.forEach((record) => {
    createRecord(record.message, record.imgName);
  });
}

const submitButton = document.getElementById("submit");
submitButton.addEventListener("click", formSubmit);

async function formSubmit() {
  const message = document.getElementById("message");
  const image = document.getElementById("image");
  if (
    image.files.length === 0 ||
    message.value === null ||
    message.value.trim() == ""
  ) {
    alert("請同時上傳留言及圖片");
    return;
  } else {
    const formData = new FormData();
    formData.append("message", message.value);
    formData.append("image", image.files[0]);
    const postRecordRes = await fetch("/records", {
      method: "POST",
      body: formData,
    });
    message.value = null;
    image.value = "";
    const postRecord = await postRecordRes.json();
    const getRecordRes = await fetch(`/records/${postRecord.recordId}`);
    const response = await getRecordRes.json();
    const record = await response.data;
    await createRecord(record[0].message, record[0].imgName);
  }
}

function createRecord(message, imgName) {
  const formEnd = document.getElementById("formEnd");
  const recordDiv = document.createElement("div");
  const recordImg = document.createElement("img");
  const messageDiv = document.createElement("div");
  const messageContent = document.createTextNode(message);
  messageDiv.appendChild(messageContent);
  recordImg.src = `https://d1vtxzr7xihthx.cloudfront.net/${imgName}`;
  recordDiv.appendChild(messageDiv);
  recordDiv.appendChild(recordImg);
  insertAfter(formEnd, recordDiv);
}

function insertAfter(referenceNode, newNode) {
  referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}
