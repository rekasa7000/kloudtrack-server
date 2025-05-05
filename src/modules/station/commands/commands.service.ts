/**
 * Get command history for a station
 * @param stationId The station ID to get commands for
 * @param limit Maximum number of commands to return
 * @returns Promise with command history
 */
export async function getCommandHistory(stationId: string, limit: number = 50): Promise<any[]> {
    try {
      const commands = await prisma.command.findMany({
        where: {
          stationId: stationId
        },
        orderBy: {
          sentAt: 'desc'
        },
        take: limit
      });
      
      return commands.map(cmd => ({
        ...cmd,
        parameters: cmd.parameters ? JSON.parse(cmd.parameters) : null,
        response: cmd.response ? JSON.parse(cmd.response) : null
      }));
    } catch (error) {
      logger.error(`Failed to get command history for station ${stationId}:`, error);
      throw error;
    }
  }
  
  /**
   * Get command by ID
   * @param commandId The command ID
   * @returns Promise with command details
   */
  export async function getCommandById(commandId: string): Promise<any> {
    try {
      const command = await prisma.command.findUnique({
        where: {
          id: commandId
        }
      });
      
      if (!command) {
        throw new Error(`Command ${commandId} not found`);
      }
      
      return {
        ...command,
        parameters: command.parameters ? JSON.parse(command.parameters) : null,
        response: command.response ? JSON.parse(command.response) : null
      };
    } catch (error) {
      logger.error(`Failed to get command ${commandId}:`, error);
      throw error;
    }
  }
  
  export async function sendCommand(command: StationCommand): Promise<any> {
    try {
      // First, check if the station exists and is active
      const station = await prisma.station.findFirst({
        where: {
          stationId: command.stationId,
          active: true
        }
      });
  
      if (!station) {
        throw new Error(`Station ${command.stationId} not found or inactive`);
      }