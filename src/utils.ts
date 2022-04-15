import { exec } from 'child_process';

export class Utils {
  public static address0 = '0x0000000000000000000000000000000000000000';
  public static getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
  }
}

export class ResponseUtils {
  static getSuccessResponse(data: any, message?: string): Response {
    const r: Response = {
      status: 'success',
      message: message,
      data: data,
    };

    return r;
  }
}

export class Response {
  status: string;
  message: string;
  data: any;
}

export const callTerminal = (command, callback, logger) => {  
  exec(command, (err, stdout, stderr) => {
    if (err) {
      console.error(err);
      callback(-1, err.message);
      return;
    }

    if (stderr) {
      callback(-1, stderr);
      logger.error(stderr);
      return;
    }
    
    logger.log(stdout);
    callback(0, 'success');
  });
};
