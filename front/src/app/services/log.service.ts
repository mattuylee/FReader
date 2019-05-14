import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LogService {

  //最近100条错误
  private errors: { err: any, title?: string }[] = []
  
  err(option: { err: any, title?: string }) {
    console.log(option.title, option.err)
    this.errors.push(option)
    while (this.errors.length > 100)
      this.errors.shift()
  }

}
