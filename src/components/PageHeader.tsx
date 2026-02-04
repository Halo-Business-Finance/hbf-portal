import { ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  loading?: boolean;
}
export const PageHeader = ({
  title,
  subtitle,
  children,
  loading = false
}: PageHeaderProps) => {
  return <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] bg-blue-950 text-primary-foreground">
      <div className="max-w-7xl mx-auto sm:px-6 md:py-[30px] lg:px-[34px] px-[30px] py-[15px]">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            {loading ? <>
                <Skeleton className="h-7 md:h-9 w-48 mb-2 bg-white/20" />
                <Skeleton className="h-4 md:h-5 w-72 bg-white/10" />
              </> : <>
                <h1 className="font-bold mb-1 text-lg md:text-2xl">
                  {title}
                </h1>
                {subtitle}
              </>}
          </div>
          {children && !loading && <div className="flex items-center gap-2">
              {children}
            </div>}
        </div>
      </div>
    </div>;
};
export const PageHeaderSkeleton = () => <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] bg-blue-950 animate-pulse">
    <div className="max-w-7xl mx-auto sm:px-6 md:py-[30px] lg:px-[34px] px-[30px] py-[15px]">
      <Skeleton className="h-7 md:h-9 w-48 mb-2 bg-white/20" />
      <Skeleton className="h-4 md:h-5 w-72 bg-white/10" />
    </div>
  </div>;