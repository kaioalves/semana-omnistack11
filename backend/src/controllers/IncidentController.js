const connection = require('../database/connection');

module.exports = {
    async index(request, response) {
        const { page = 1 } = request.query;

        const [count] = await connection('incidents').count();

        const incidents = await connection('incidents')
            .limit(5) //limitar em 5 registros por página
            .offset((page - 1) * 5)
            .select('*');

        //retorna o total de Casos no cabeçalho da resposta
        response.header('X-Total-Count', count['count(*)']);
        console.log(count);

        return response.json(incidents);
    },

    async create(request, response) {
        const { title, description, value } = request.body;

        //ong_id = headers: authorization 4d9ff000
        const ong_id = request.headers.authorization;

        const [id] = await connection('incidents').insert({
            title,
            description,
            value,
            ong_id,
        });

        return response.json({ id });
    },

    async delete(request, response) {
        const { id } = request.params;
        const ong_id = request.headers.authorization;

        const incident = await connection('incidents')
            .where('id', id)
            .select('ong_id')
            .first();

        //não permitir deletar incidents de outra Ong
        if (incident.ong_id !== ong_id) {
            return response.status(401).json({ error: 'Operation not permitted.' })
        }

        await connection('incidents').where('id', id).delete();

        return response.status(204).send();
    }
};
