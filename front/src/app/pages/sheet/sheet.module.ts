import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { SheetPage } from './sheet.page';
import { Routes, RouterModule } from '@angular/router';
import { ComponentsModule } from 'src/app/components/components.module';

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
    ComponentsModule
  ],
  declarations: [SheetPage]
})
export class SheetPageModule {}
