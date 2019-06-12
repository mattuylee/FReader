import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LogService {

  //最近100条错误
  private errors: { err: any, title?: string }[] = []
  
  public err(option: { err: any, title?: string }) {
    if (!option.err) return
    console.log('error log: ', option.title, option.err)
    if (option.err.message)
      option = option.err.message
    this.errors.push(option)
    while (this.errors.length > 100)
      this.errors.shift()
  }

  public getErrors() {
    return this.errors
  }
}

export class FError {
  title?: string
  err: any
}
