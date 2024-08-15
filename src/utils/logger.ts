export default class Logger {
  static error(action: string, message: string) {
    console.error(
      `[ERROR] [${new Date().toISOString()}] [${action}] ${message}`
    );
  }
  static start(action: string, message: string = "") {
    console.log(
      `[START] [${new Date().toISOString()}] [${action}] Action started`
    );
  }
  static end(action: string, message: string = "") {
    console.log(
      `[END] [${new Date().toISOString()}] [${action}] Action ended\n[MESSAGE] ${message}.`
    );
  }
  static warn(action: string, message: string = "") {}
}
