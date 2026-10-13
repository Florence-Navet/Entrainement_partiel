import app from "./app";
import config from "./config/env";

app.listen(config.port, () => {
    console.log(`Hello World API listening on http://localhost:${config.port}`);
});
