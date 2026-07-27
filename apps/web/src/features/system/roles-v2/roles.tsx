import { Link } from '@tanstack/react-router'
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader
} from '@zen/ui'
import { MoreHorizontal, Shield, ShieldCheck } from 'lucide-react'

import { AppHeader, Main } from '@/components/layouts'
import { PageHeader } from '@/components/page-header'

export function Roles() {
  return (
    <>
      <AppHeader />

      <Main fixed className="flex flex-1 flex-col gap-4 sm:gap-6">
        <PageHeader
          title="角色管理"
          description="管理系统中的所有角色"
          actions={<Button>新增角色</Button>}
        />

        <section className="flex gap-4">
          <Card className="w-85 rounded-3xl ">
            <CardHeader>
              <div className="flex gap-3">
                <Link to="/system/roles-v2/$id" params={{ id: '1' }} className="flex flex-1 gap-3">
                  <div className="size-12 rounded-full bg-slate-100 flex items-center justify-center">
                    <Shield className="text-slate-500 dark:text-slate-50" />
                  </div>

                  <div className="flex-1">
                    <h2 className="text-foreground text-sm font-medium flex items-center gap-2">
                      超级管理员
                    </h2>
                    <div className="flex gap-2 text-xs text-muted-foreground mt-1">
                      super_admin
                      <Badge className=" border border-green-700/20 bg-green-50 text-green-700 dark:border-green-700/60 dark:bg-green-950 dark:text-green-300">
                        激活
                      </Badge>
                    </div>
                  </div>
                </Link>

                <Button variant="ghost" size="icon">
                  <MoreHorizontal />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground line-clamp-2 min-h-10 text-sm leading-5">
                拥有系统用户管理、角色管理等所有的权限，该角色不可以删除
              </p>
              <div className="flex justify-between items-center mt-3">
                <div className="flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20">
                  <ShieldCheck className="size-3.5" />
                  <span>36 项权限</span>
                </div>
                <AvatarGroup>
                  <Avatar size="sm">
                    <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                    <AvatarFallback>CN</AvatarFallback>
                  </Avatar>
                  <Avatar size="sm">
                    <AvatarImage src="https://github.com/maxleiter.png" alt="@maxleiter" />
                    <AvatarFallback>LR</AvatarFallback>
                  </Avatar>
                  <Avatar size="sm">
                    <AvatarImage src="https://github.com/evilrabbit.png" alt="@evilrabbit" />
                    <AvatarFallback>ER</AvatarFallback>
                  </Avatar>
                  <AvatarGroupCount>+3</AvatarGroupCount>
                </AvatarGroup>
              </div>
            </CardContent>
          </Card>

          <Card className="w-85 rounded-3xl ">
            <CardHeader>
              <div className="flex gap-3">
                <Link to="/system/roles-v2/$id" params={{ id: '1' }} className="flex flex-1 gap-3">
                  <div className="size-12 rounded-full bg-slate-100 flex items-center justify-center">
                    <Shield className="text-slate-500 dark:text-slate-50" />
                  </div>

                  <div className="flex-1">
                    <h2 className="text-foreground text-sm font-medium flex items-center gap-2">
                      超级管理员
                    </h2>
                    <div className="flex gap-2 text-xs text-muted-foreground mt-1">
                      super_admin
                      <Badge className=" border border-green-700/20 bg-green-50 text-green-700 dark:border-green-700/60 dark:bg-green-950 dark:text-green-300">
                        激活
                      </Badge>
                    </div>
                  </div>
                </Link>

                <Button variant="ghost" size="icon">
                  <MoreHorizontal />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col">
                <p className="text-muted-foreground line-clamp-2 min-h-10 text-sm leading-5">
                  拥有系统用户管理、角色管理等所有的权限
                </p>
                <div className="flex justify-between items-center mt-3">
                  <div className="flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20">
                    <ShieldCheck className="size-3.5" />
                    <span>36 项权限</span>
                  </div>
                  <AvatarGroup>
                    <Avatar size="sm">
                      <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                      <AvatarFallback>CN</AvatarFallback>
                    </Avatar>
                    <Avatar size="sm">
                      <AvatarImage src="https://github.com/maxleiter.png" alt="@maxleiter" />
                      <AvatarFallback>LR</AvatarFallback>
                    </Avatar>
                    <Avatar size="sm">
                      <AvatarImage src="https://github.com/evilrabbit.png" alt="@evilrabbit" />
                      <AvatarFallback>ER</AvatarFallback>
                    </Avatar>
                    <AvatarGroupCount>+3</AvatarGroupCount>
                  </AvatarGroup>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* <div className="flex-1 flex flex-wrap gap-4">
          <aside className="w-80 h-full border rounded-xl p-4">
               <header className='flex items-center justify-between'>
                   <h2>角色列表</h2>
                   <Badge variant="secondary" className='text-xs'>10</Badge>
               </header>

          </aside>

          <main className="flex-1 h-full border rounded-xl">main</main>
        </div> */}
      </Main>
    </>
  )
}
