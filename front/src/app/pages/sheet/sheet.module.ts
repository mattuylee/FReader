import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { SheetPage } from './sheet.page';
import { Routes, RouterModule } from '@angular/router';

const routs: Routes = [{
    path: '',
    component: SheetPage,
    pathMatch: 'full'
  }]

@NgModule({
  imports: [
    RouterModule.forChild(routs),
    CommonModule,
    FormsModule,
    IonicModule,
  ],
  declarations: [SheetPage]
})
export class SheetPageModule {}
