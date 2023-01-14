import express from "express";
import multer from "multer";
import dotenv from "dotenv";
import crypto from "crypto";
import mysql from "mysql";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

dotenv.config();
const bucketName = process.env.BUCKET_NAME;
const bucketRegion = process.env.BUCKET_REGION;
const accessKey = process.env.ACCESS_KEY;
const secretAccessKey = process.env.SECRET_ACCESS_KEY;
const mysqlHost = process.env.MYSQL_HOST;
const mysqlUser = process.env.MYSQL_USER;
const mysqlPassword = process.env.MYSQL_PASSWORD;
const mysqlDatabase = process.env.MYSQL_DATABASE;

const pool = mysql.createPool({
  connectionLimit: 10,
  host: mysqlHost,
  user: mysqlUser,
  password: mysqlPassword,
  database: mysqlDatabase,
});
const createCryptoImageName = (bytes = 32) =>
  crypto.randomBytes(bytes).toString("hex");
const s3 = new S3Client({
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey: secretAccessKey,
  },
  region: bucketRegion,
});

const app = express();
const port = 8080;

app.use("/js", express.static("public"));
app.use("/css", express.static("public"));
app.set("view engine", "ejs");

app.get("/", function (req, res) {
  res.render("messageBoard");
});
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.get("/records", async (req, res) => {
  try {
    pool.getConnection(function (err, connection) {
      if (err) {
        console.log(err);
        return;
      } else {
        const query = "SELECT * FROM record";
        connection.query(query, function (err, result) {
          if (err) {
            console.log(err);
            return;
          }
          const records = JSON.parse(JSON.stringify(result));
          res.status(200).send({ data: records });
        });
      }
    });
  } catch (err) {
    console.log(err);
  }
});

app.get("/records/:recordId", async (req, res) => {
  try {
    const recordId = req.params.recordId;
    pool.getConnection(function (err, connection) {
      if (err) {
        console.log(err);
        return;
      } else {
        const query = "SELECT message, imgName FROM record WHERE id = ?";
        connection.query(query, [recordId], function (err, result) {
          if (err) {
            console.log(err);
            return;
          }
          const record = JSON.parse(JSON.stringify(result));
          res.status(200).send({ data: record });
        });
      }
    });
  } catch (err) {
    console.log(err);
  }
});

app.post("/records", upload.single("image"), async (req, res) => {
  try {
    const cryptoImageName = createCryptoImageName();
    const params = {
      Bucket: bucketName,
      Key: cryptoImageName,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    };
    const command = new PutObjectCommand(params);
    const response = await s3.send(command);
    if (response.$metadata.httpStatusCode === 200) {
      pool.getConnection(function (err, connection) {
        if (err) {
          console.log(err);
          return;
        } else {
          const data = { message: req.body.message, imgName: cryptoImageName };
          const query = "INSERT INTO record (message, imgName) VALUES (?)";
          connection.query(
            query,
            [Object.values(data)],
            function (err, result) {
              if (err) {
                console.log(err);
                return;
              }
              res.status(200).send({ recordId: result.insertId });
            }
          );
        }
      });
    }
  } catch (err) {
    console.log(err);
    return;
  }
});

app.listen(port);
