import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { Calendar, Trash2 } from 'lucide-react';
import { calculateGoalProgress, getBusinessUnitName, getStatusColor } from './utils';
import type { Goal, Sale, BusinessUnit } from './types';

interface CurrentGoalsCardProps {
  goals: Goal[];
  sales: Sale[];
  businessUnits: BusinessUnit[];
  onDeleteGoal: (goalId: string) => void;
  isAdmin: boolean;
}

export default function CurrentGoalsCard({
  goals,
  sales,
  businessUnits,
  onDeleteGoal,
  isAdmin
}: CurrentGoalsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Metas del Mes Actual
        </CardTitle>
      </CardHeader>
      <CardContent>
        {goals.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No hay metas configuradas para este mes</p>
            <p className="text-sm text-muted-foreground">
              {isAdmin ? 'Crea la primera meta para comenzar' : 'El administrador configurará las metas'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {goals.map((goal) => {
              const progress = calculateGoalProgress(goal, sales);
              
              return (
                <div key={goal.id} className="space-y-3">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                      <h4 className="font-medium">
                        {getBusinessUnitName(businessUnits, goal.business_unit_id)}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        ${progress.actualAmount.toLocaleString()} / ${goal.target_amount.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(progress.status)}>
                        {progress.status}
                      </Badge>
                      {progress.progress >= 100 && (
                        <Badge variant="outline" className="text-green-600">
                          Bono: ${progress.bonusCalculated.toLocaleString()}
                        </Badge>
                      )}
                      {isAdmin && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar meta?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción eliminará permanentemente la meta para "{getBusinessUnitName(businessUnits, goal.business_unit_id)}" del mes actual.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => onDeleteGoal(goal.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progreso: {Math.round(progress.progress)}%</span>
                      <span>Bono: {goal.bonus_percentage}%</span>
                    </div>
                    <Progress 
                      value={Math.min(progress.progress, 100)} 
                      className="h-2"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}