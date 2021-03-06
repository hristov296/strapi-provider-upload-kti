"use strict";

/**
 * Module dependencies
 */

// Public node modules.
const fs = require("fs");
const path = require("path");
// const strapi = require("strapi");
/* eslint-disable no-unused-vars */
module.exports = {
  provider: "local",
  name: "Local server KTI",
  init: ({ sizeLimit = 1000000 } = {}) => {
    const verifySize = (file) => {
      if (file.size > sizeLimit) {
        throw strapi.errors.badRequest("FileToBig", {
          errors: [
            {
              id: "Upload.status.sizeLimit",
              message: `${file.name} file is bigger than limit size!`,
              values: { file: file.name },
            },
          ],
        });
      }
    };

    return {
      upload: (file) => {
        verifySize(file);

        return new Promise((resolve, reject) => {
          // write file in public/assets folder
          let newBigFilename = file.name.replace(/\s+/g, "-");

          const tryWriteFile = (path, data, filename) => {
            fs.writeFile(path, data, { flag: "wx" }, (err) => {
              if (err && err.code === "EEXIST") {
                let newFilename;
                const regex = /-(\d{1,3})$/;

                if (regex.test(filename)) {
                  newFilename = filename.replace(regex, (match, n) => "-" + (Number(n) + 1));
                } else {
                  newFilename = filename + "-1";
                }

                tryWriteFile(currentPath(newFilename), data, newFilename);
              } else if (!err) {
                file.url = `/uploads/${filename}${file.ext}`;
                file.name = filename + file.ext;
                resolve();
              } else {
                return reject(err);
              }
            });
          };

          const currentPath = (filename) =>
            path.join(strapi.config.paths.static, `/uploads/${filename}${file.ext}`);

          tryWriteFile(
            currentPath(newBigFilename.replace(file.ext, "")),
            file.buffer,
            newBigFilename.replace(file.ext, "")
          );

        });
      },
      delete: (file) => {
        return new Promise((resolve, reject) => {
          const filePath = path.join(strapi.config.paths.static, `/uploads/${file.name}`);

          if (!fs.existsSync(filePath)) {
            return resolve("File doesn't exist");
          }

          // remove file from public/assets folder
          fs.unlink(filePath, (err) => {
            if (err) {
              return reject(err);
            }

            resolve();
          });
        });
      },
    };
  },
};
