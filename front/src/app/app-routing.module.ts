import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

//由于无法监听到tab页面的进入和退出，放弃使用tab导航。。

const routes: Routes = [
  //{ path: '', loadChildren: './pages/tabs/tabs.module#TabsPageModule' },
  { path: '', redirectTo: '/sheet', pathMatch: 'full' },
  /* param: { needLogin } */
  { path: 'sheet', loadChildren: './pages/sheet/sheet.module#SheetPageModule' },
  { path: 'explore', loadChildren: './pages/explore/explore.module#ExplorePageModule' },
  { path: 'setting', loadChildren: './pages/setting/setting.module#SettingPageModule' },
  /* params : { uid, pwd, canBack } */
  { path: 'login', loadChildren: './pages/login/login.module#LoginPageModule' },
  { path: 'register', loadChildren: './pages/register/register.module#RegisterPageModule' },
  { path: 'search', loadChildren: './pages/search/search.module#SearchPageModule' },
  /* params : { bid } */
  { path: 'detail', loadChildren: './pages/detail/detail.module#DetailPageModule', data: {} },
  /* params : { bid, focusCid, fromReadPage, title } */
  { path: 'catalog', loadChildren: './pages/catalog/catalog.module#CatalogPageModule' },
  /* 不应直接导航到/read，而应通过ReadService来载入阅读页 */
  { path: 'read', loadChildren: './pages/read/read.module#ReadPageModule' },
  /* 创建新的书架书籍分组 */
  /* params : { bid, gid } */
  { path: 'shelf-group', loadChildren: './pages/shelf-group/shelf-group.module#ShelfGroupPageModule' },
  /* 书架分组 */
  /* params: { gid } */
  { path: 'group', loadChildren: './pages/group/group.module#GroupPageModule' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
