import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Toolbar from "./common/Toolbar/Toolbar";
import PanoViewer from "@/shared/components/PanoViewer";

export default function Home() {

  return (
    /*
    <div className="max-w-7xl mx-auto p-4 lg:p-6">
      <Toolbar/>      

      <div className="mt-4 grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-4 lg:gap-6">
        <Card className="overflow-hidden">
          <div className="p-2">
            <Tabs defaultValue="open" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="open">Offen</TabsTrigger>
                <TabsTrigger value="done">Erledigt</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <CardContent className="p-0">
            <ScrollArea className="h-[520px]">
              <div className="divide-y">hier kommen die items hin</div>
            </ScrollArea>
          </CardContent>
        </Card>

        <div className="space-y-4">cards</div>
      </div>
    </div>
    */
   <>
    <main style={{ maxWidth: 500, margin: "40px auto", padding: 16 }}>
      <h1>360° Viewer</h1>
      <PanoViewer src="/panos/timothy-oldfield-luufnHoChRU-unsplash.jpg"/>
    </main>
   </>
  );
}
